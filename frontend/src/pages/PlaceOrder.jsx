import { useState, useEffect, useRef } from "react";
import axios from "axios";
import DashboardLayout from "../components/layout/DashboardLayout";

function PlaceOrder() {

  const user = JSON.parse(localStorage.getItem("user"));
  const branchId = user?.branch_id;

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [resolvedCust, setResolvedCust] = useState(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerIndex, setCustomerIndex] = useState(0);

  const [items, setItems] = useState([
    { product_id: "", quantity: "", discount: 0, search: "", show: false }
  ]);

  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const dropdownRefs = useRef([]);

  /* =========================
     🔹 FETCH DATA
  ========================= */
  useEffect(() => {

    axios.get("http://127.0.0.1:5000/customers")
      .then(res => setCustomers(res.data))
      .catch(()=>{});

    axios.get(`http://127.0.0.1:5000/branch_products/${branchId}`)
      .then(res => setProducts(res.data))
      .catch(()=>{});

  }, []);

  /* =========================
     🔹 CUSTOMER FILTER
  ========================= */
  const filteredCustomers = customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email}`
      .toLowerCase()
      .includes(`${firstName} ${lastName} ${email}`.toLowerCase())
  ).slice(0,5);

  const selectCustomer = (c) => {
    setFirstName(c.first_name);
    setLastName(c.last_name);
    setEmail(c.email);
    setResolvedCust(c);
    setShowCustomerDropdown(false);
  };

  const resolveCustomer = async () => {

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/resolve_customer",
        { first_name: firstName, last_name: lastName, email }
      );

      setResolvedCust(res.data);
      alert(res.data.is_new ? "New customer created" : "Customer found");

    } catch {
      alert("Error resolving customer");
    }
  };

  /* =========================
     🔹 ITEM UPDATE
  ========================= */
  const updateItem = (index, field, value) => {

    const newItems = [...items];

    if (field === "quantity") {
      const product = products.find(p => p[0] === newItems[index].product_id);
      const stock = product ? product[3] : Infinity;

      let qty = parseInt(value);
      if (isNaN(qty)) qty = "";

      if (qty < 1) qty = 1;
      if (qty > stock) qty = stock;

      newItems[index].quantity = qty;
    }

    else if (field === "discount") {
      let d = parseFloat(value);
      if (isNaN(d)) d = 0;

      if (d < 0) d = 0;
      if (d > 100) d = 100;

      newItems[index].discount = d;
    }

    else {
      newItems[index][field] = value;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: "", discount: 0, search: "", show: false }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  /* =========================
     🔹 PLACE ORDER
  ========================= */
  const placeOrder = async () => {

    if (!resolvedCust) {
      alert("Select a customer");
      return;
    }

    const data = {
      user_id: user?.user_id,
      customer_id: resolvedCust.customer_id,
      branch_id: branchId,
      product_ids: items.map(i => parseInt(i.product_id)),
      quantities: items.map(i => parseInt(i.quantity)),
      discounts: items.map(i => parseFloat(i.discount))
    };

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/place_order",
        data
      );

      alert(res.data.message);

    } catch (err) {
      alert(err.response?.data?.error || "Error placing order");
    }
  };

  /* =========================
     🔹 TOTAL
  ========================= */
  const total = items.reduce((sum, item) => {
    const p = products.find(p => p[0] === item.product_id);
    if (!p) return sum;
    return sum + p[2] * item.quantity * (1 - item.discount / 100);
  }, 0);

  return (
    <DashboardLayout>

      <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow">

        <h2 className="text-xl font-bold mb-4">Place Order</h2>

        {/* 🔥 CUSTOMER */}
        <div className="relative mb-4">

          <div className="grid grid-cols-3 gap-3">

            <input
              className="p-2 border rounded"
              placeholder="First Name"
              value={firstName}
              onChange={(e)=>{setFirstName(e.target.value); setShowCustomerDropdown(true);}}
            />

            <input
              className="p-2 border rounded"
              placeholder="Last Name"
              value={lastName}
              onChange={(e)=>{setLastName(e.target.value); setShowCustomerDropdown(true);}}
            />

            <input
              className="p-2 border rounded"
              placeholder="Email"
              value={email}
              onChange={(e)=>{setEmail(e.target.value); setShowCustomerDropdown(true);}}
            />

          </div>

          {showCustomerDropdown && (
            <div className="absolute bg-white border w-full mt-1 rounded shadow z-50">

              {filteredCustomers.map((c, i) => (
                <div
                  key={c.customer_id}
                  className={`p-2 cursor-pointer ${i===customerIndex ? "bg-blue-100" : ""}`}
                  onClick={()=>selectCustomer(c)}
                >
                  {c.first_name} {c.last_name} — {c.email}
                </div>
              ))}

              <div
                className="p-2 text-blue-600 border-t cursor-pointer"
                onClick={resolveCustomer}
              >
                + Create New Customer
              </div>

            </div>
          )}

        </div>

        {/* 🔥 PRODUCTS */}
        {items.map((item, index) => {

          const filtered = products.filter(p =>
            `${p[1]} ${p[4]}`.toLowerCase().includes(item.search.toLowerCase())
          ).slice(0,5);

          return (
            <div key={index} className="grid grid-cols-4 gap-3 mb-3">

              <div className="relative">

                <input
                  className="p-2 border rounded w-full"
                  placeholder="Search product..."
                  value={item.search}
                  onFocus={()=>updateItem(index,"show",true)}
                  onChange={(e)=>{
                    updateItem(index,"search",e.target.value);
                    updateItem(index,"show",true);
                  }}
                />

                {item.show && (
                  <div className="absolute bg-white border w-full rounded shadow z-50 max-h-48 overflow-y-auto">

                    {filtered.map((p, i) => (
                      <div
                        key={p[0]}
                        className={`p-2 cursor-pointer text-sm ${i===activeProductIndex ? "bg-blue-100" : ""}`}
                        onClick={()=>{
                          updateItem(index,"product_id",p[0]);
                          updateItem(index,"search",`${p[1]} (${p[4]})`);
                          updateItem(index,"show",false);
                        }}
                      >
                        {p[1]} ({p[4]}) — ₹{p[2]} | Stock: {p[3]}
                      </div>
                    ))}

                  </div>
                )}

              </div>

              <input
                type="number"
                className="p-2 border rounded"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e)=>updateItem(index,"quantity",e.target.value)}
              />

              <input
                type="number"
                className="p-2 border rounded"
                placeholder="Discount %"
                value={item.discount}
                onChange={(e)=>updateItem(index,"discount",e.target.value)}
              />

              <button
                className="bg-red-500 text-white rounded"
                onClick={()=>removeItem(index)}
              >
                X
              </button>

            </div>
          );
        })}

        <button className="bg-gray-200 px-3 py-1 rounded mb-3" onClick={addItem}>
          + Add Product
        </button>

        <h3 className="text-right font-bold mb-3">
          Total: ₹{total.toFixed(2)}
        </h3>

        <button
          className="bg-green-600 text-white w-full py-2 rounded"
          onClick={placeOrder}
        >
          Place Order
        </button>

      </div>

    </DashboardLayout>
  );
}

export default PlaceOrder;