import { useState, useEffect } from "react";
import axios from "axios";

function Returns() {

  const [orderId, setOrderId] = useState("");
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  // fetch order items when orderId changes
  useEffect(() => {

    if (!orderId) return;

    axios
      .get(`http://127.0.0.1:5000/order/${orderId}`)
      .then(res => {
        setProducts(res.data.items);
      })
      .catch(err => console.error(err));

  }, [orderId]);

  const handleReturn = async () => {

    const data = {
      order_id: parseInt(orderId),
      product_id: parseInt(productId),
      quantity: parseInt(quantity)
    };

    try {

      const res = await axios.post(
        "http://127.0.0.1:5000/process_return",
        data
      );

      alert(res.data.message);

    } catch (err) {

      if (err.response && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert("Error processing return");
      }

    }

  };

  return (

    <div className="container mt-5">

      <div className="card shadow">

        <div className="card-header bg-dark text-white">
          <h3>Process Return</h3>
        </div>

        <div className="card-body">

          {/* ORDER ID */}
          <input
            type="number"
            placeholder="Order ID"
            className="form-control mb-3"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />

          {/* PRODUCT DROPDOWN */}
          <select
            className="form-control mb-3"
            onChange={(e) => setProductId(e.target.value)}
          >
            <option>Select Product</option>

            {products.map((p, index) => (
              <option key={index} value={p[5]}>
                {p[0]} (Qty: {p[1]})
              </option>
            ))}

          </select>

          {/* QUANTITY */}
          <input
            type="number"
            placeholder="Return Quantity"
            className="form-control mb-3"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <button
            className="btn btn-danger w-100"
            onClick={handleReturn}
          >
            Process Return
          </button>

        </div>

      </div>

    </div>

  );

}

export default Returns;