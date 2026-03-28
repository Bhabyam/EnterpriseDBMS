import { useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

function AddPayment() {

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderFromURL = params.get("order_id");

  const [orderId, setOrderId] = useState(orderFromURL || "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");

  const addPayment = async () => {

    const data = {
      order_id: parseInt(orderId),
      amount: parseFloat(amount),
      payment_method: method
    };

    try {

      const res = await axios.post(
        "http://127.0.0.1:5000/add_payment",
        data
      );

      alert(
        res.data.message +
        "\nRemaining Amount: ₹" + res.data.remaining
      );

    } catch (err) {

      console.error(err);

      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert("Error adding payment");
      }

    }

  };

  return (

    <div className="container mt-5">

      <h2>Add Payment</h2>

      <input
        type="number"
        placeholder="Order ID"
        className="form-control mb-3"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount"
        className="form-control mb-3"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <select
        className="form-control mb-3"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
      >
        <option value="">Select Payment Method</option>
        <option value="Cash">Cash</option>
        <option value="UPI">UPI</option>
        <option value="Card">Card</option>
      </select>

      <button
        className="btn btn-success"
        onClick={addPayment}
      >
        Add Payment
      </button>

    </div>

  );

}

export default AddPayment;