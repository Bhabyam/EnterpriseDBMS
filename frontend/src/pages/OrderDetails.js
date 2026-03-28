import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function OrderDetails(){

  const { id } = useParams();

  const [items,setItems] = useState([]);
  const [summary,setSummary] = useState(null);

  useEffect(()=>{

    axios
      .get(`http://127.0.0.1:5000/order/${id}`)
      .then(res=>{
        setItems(res.data.items);
        setSummary(res.data.summary);
      })
      .catch(err=>console.error(err));

  },[id]);


  const downloadInvoice = () => {

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Retail Management System", 14, 20);

    doc.setFontSize(14);
    doc.text(`Invoice: ${summary[0]}`, 14, 30);

    autoTable(doc,{
      startY:40,
      head:[["Product","Qty","Price","Discount","Subtotal"]],
      body:items
    });

    const y = doc.lastAutoTable.finalY + 10;

    doc.text("Total: " + summary[1], 14, y);
    doc.text("Paid: " + summary[2], 14, y + 8);
    doc.text("Remaining: " + summary[3], 14, y + 16);
    doc.text("Status: " + summary[4], 14, y + 24);

    doc.save(`invoice_${summary[0]}.pdf`);
  };


  if(!summary){
    return <div className="container mt-4">Loading...</div>
  }


  return (

  <div className="container mt-4">

    <div className="card shadow">

      <div className="card-header bg-dark text-white">
        <h3>Invoice {summary[0]}</h3>
      </div>

      <div className="card-body">

        <table className="table table-striped table-hover shadow-sm">

          <thead className="table-dark">
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>

            {items.map((i,index)=>(
              <tr key={index}>
                <td>{i[0]}</td>
                <td>{i[1]}</td>
                <td>₹{i[2]}</td>
                <td>{i[3]}%</td>
                <td>₹{i[4]}</td>
              </tr>
            ))}

          </tbody>

        </table>

        <div className="row mt-4">

          <div className="col-md-6">
            <h5>Total: ₹{summary[1]}</h5>
            <h5>Paid: ₹{summary[2]}</h5>
            <h5>Remaining: ₹{summary[3]}</h5>
          </div>

          <div className="col-md-6 text-end">

            <span className={`badge ${
              summary[4]==="Delivered"
              ? "bg-success"
              : summary[4]==="Confirmed"
              ? "bg-primary"
              : "bg-warning"
            }`}>
              {summary[4]}
            </span>

          </div>

        </div>

        {summary[3] > 0 && (

          <div className="mt-4">

            <a
              href={`/payment?order_id=${id}`}
              className="btn btn-success me-2"
            >
              Add Payment
            </a>

          </div>

        )}

        <button
          className="btn btn-secondary mt-3"
          onClick={downloadInvoice}
        >
          Download Invoice PDF
        </button>

      </div>

    </div>

  </div>

);
}

export default OrderDetails;