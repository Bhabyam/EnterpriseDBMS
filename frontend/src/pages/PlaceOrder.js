import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";

function PlaceOrder() {

  const [customerId, setCustomerId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [products, setProducts] = useState([]);

  const [items, setItems] = useState([
    { product_id: "", quantity: "", discount: 0 }
  ]);



  useEffect(() => {

    if (branchId) {

      axios
        .get(`http://127.0.0.1:5000/branch_products/${branchId}`)
        .then(res => {
          setProducts(res.data);
        })
        .catch(err => console.error(err));

    }

  }, [branchId]);



  const addItem = () => {

    setItems([
      ...items,
      { product_id: "", quantity: "", discount: 0 }
    ]);

  };



  const removeItem = (index) => {

    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);

  };



  const updateItem = (index, field, value) => {

    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);

  };



  const placeOrder = async () => {

    // STOCK VALIDATION
    for (let item of items) {

      const product = products.find(p => p[0] == item.product_id);

      if (!product) continue;

      const stock = product[3];
      const qty = parseInt(item.quantity);

      if (qty > stock) {

        alert(`Only ${stock} items available for ${product[1]}`);
        return;

      }

    }



    const product_ids = items.map(i => parseInt(i.product_id));
    const quantities = items.map(i => parseInt(i.quantity));
    const discounts = items.map(i => parseInt(i.discount));



    const data = {
      user_id: 1,
      customer_id: parseInt(customerId),
      branch_id: parseInt(branchId),
      product_ids: product_ids,
      quantities: quantities,
      discounts: discounts
    };



    try {

      const res = await axios.post(
        "http://127.0.0.1:5000/place_order",
        data
      );

      alert(res.data.message);

    } catch (err) {

      if (err.response && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert("Error placing order");
      }

    }

  };



  const total = items.reduce((sum, item) => {

    const product = products.find(p => p[0] == item.product_id);

    if (!product) return sum;

    const price = product[2];
    const qty = item.quantity || 0;
    const discount = item.discount || 0;

    const subtotal = price * qty * (1 - discount / 100);

    return sum + subtotal;

  }, 0);



  return (

    <div className="container mt-5">

      <div className="card shadow">

        <div className="card-header bg-dark text-white">
          <h3 className="mb-0">Place Order</h3>
        </div>

        <div className="card-body">

          <div className="mb-3">

            <label className="form-label">Customer ID</label>

            <input
              type="number"
              className="form-control"
              onChange={(e) => setCustomerId(e.target.value)}
            />

          </div>



          <div className="mb-4">

            <label className="form-label">Branch ID</label>

            <input
              type="number"
              className="form-control"
              onChange={(e) => setBranchId(e.target.value)}
            />

          </div>



          <h5 className="mb-3">Products ({products.length})</h5>



          <div className="row fw-bold mb-2">

            <div className="col">Product</div>
            <div className="col">Quantity</div>
            <div className="col">Discount</div>
            <div className="col-1"></div>

          </div>



          {items.map((item, index) => (

            <div key={index} className="row mb-2">

              <div className="col">

                <Select
                  options={products.map(p => ({
                    value: p[0],
                    label: `${p[1]} - ₹${p[2]} (Stock: ${p[3]})`
                  }))}
                  onChange={(selected) =>
                    updateItem(index, "product_id", selected.value)
                  }
                />

              </div>



              <div className="col">

                <input
                  type="number"
                  className="form-control"
                  placeholder="Quantity"
                  onChange={(e) =>
                    updateItem(index, "quantity", e.target.value)
                  }
                />

              </div>



              <div className="col">

                <input
                  type="number"
                  className="form-control"
                  placeholder="Discount"
                  onChange={(e) =>
                    updateItem(index, "discount", e.target.value)
                  }
                />

              </div>



              <div className="col-1">

                <button
                  className="btn btn-danger"
                  onClick={() => removeItem(index)}
                >
                  X
                </button>

              </div>

            </div>

          ))}



          <button
            className="btn btn-outline-secondary mb-3"
            onClick={addItem}
          >
            + Add Product
          </button>



          <h4 className="text-end">
            Total: ₹{total.toFixed(2)}
          </h4>



          <button
            className="btn btn-success w-100 mt-3"
            onClick={placeOrder}
          >
            Place Order
          </button>


        </div>

      </div>

    </div>

  );

}

export default PlaceOrder;