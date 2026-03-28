import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function OrderHistory(){

  const [orders,setOrders] = useState([]);
  const [search,setSearch] = useState("");

  useEffect(()=>{

    axios
      .get("http://127.0.0.1:5000/orders")
      .then(res=>{
        setOrders(res.data);
      })
      .catch(err=>console.error(err));

  },[]);

  const filteredOrders = orders.filter(o =>
    o[0].toString().includes(search) ||
    o[1].toLowerCase().includes(search.toLowerCase())
  );

  return(

    <div className="container mt-4">

      <h2>Order History</h2>

      <input
        type="text"
        placeholder="Search by Order ID or Invoice"
        className="form-control mt-3 mb-3"
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
      />

      <table className="table table-striped table-hover shadow-sm">

        <thead className="table-dark">

          <tr>
            <th>Order ID</th>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Branch</th>
            <th>Date</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Remaining</th>
            <th>Status</th>
          </tr>

        </thead>

        <tbody>

          {filteredOrders.map((o,index)=>(
            <tr key={index}>

              <td>
                <Link to={`/orders/${o[0]}`}>
                  {o[0]}
                </Link>
              </td>

              <td>{o[1]}</td>
              <td>{o[2]}</td>
              <td>{o[3]}</td>
              <td>{o[4]}</td>
              <td>₹{o[5]}</td>
              <td>₹{o[6]}</td>
              <td>₹{o[7]}</td>

              <td>
                <span className={`badge ${
                  o[8]==="Delivered"
                  ? "bg-success"
                  : o[8]==="Confirmed"
                  ? "bg-primary"
                  : "bg-warning"
                }`}>
                  {o[8]}
                </span>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>

  );

}

export default OrderHistory;