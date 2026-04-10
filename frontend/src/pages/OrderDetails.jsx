import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const statusColors = {
  Delivered: "bg-green-500 text-white",
  Confirmed: "bg-blue-500 text-white",
  Pending: "bg-yellow-500 text-black",
  Cancelled: "bg-red-500 text-white",
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    API.get(`/api/orders/${id}`)
      .then(res => {
        setItems(res.data.data.items);
        setSummary(res.data.data.summary);
      })
      .catch(console.error);
  }, [id]);

  const downloadInvoice = () => {
    const doc = new jsPDF();

    doc.text(`Invoice ${summary.invoice_number}`, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Product", "Qty", "Price", "Discount", "Subtotal"]],
      body: items.map(i => [
        i.name,
        i.quantity,
        i.price,
        i.discount,
        i.sub_total,
      ])
    });

    doc.text(`Total: Rs. ${summary.total_amount}`, 14, doc.lastAutoTable.finalY + 10);

    doc.save(`invoice_${summary.invoice_number}.pdf`);
  };

  if (!summary) return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>

      <div className="bg-white rounded-xl shadow border overflow-hidden">

        {/* HEADER */}
        <div className="bg-gray-900 text-white p-4 text-lg font-semibold">
          Invoice {summary.invoice_number}
        </div>

        {/* TABLE */}
        <div className="p-4">

          <table className="w-full text-sm mb-4">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {items.map((i, idx) => (
                <tr key={idx} className="border-b">
                  <td>{i.name}</td>
                  <td>{i.quantity}</td>
                  <td>₹{i.price}</td>
                  <td>{i.discount}%</td>
                  <td>₹{i.sub_total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SUMMARY */}
          <div className="flex justify-between items-center">

            <div>
              <p>Total: ₹{summary.total_amount}</p>
              <p>Paid: ₹{summary.paid}</p>
              <p>Remaining: ₹{summary.remaining}</p>
            </div>

            <span className={`px-3 py-1 rounded ${statusColors[summary.status]}`}>
              {summary.status}
            </span>

          </div>

          {/* ACTIONS */}
          <div className="mt-4 space-x-2">

            {/* ADD PAYMENT */}
            {(summary.status === "Confirmed" || summary.status === "Pending") && (
              <button
                onClick={() => navigate(`/payment?order_id=${id}`)}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Add Payment
              </button>
            )}

            {/* RETURN */}
            {summary.status === "Delivered" && !summary.is_returned && (
              <button
                onClick={() => navigate(`/returns?order_id=${id}`)}
                className="px-4 py-2 bg-yellow-500 text-black rounded"
              >
                Process Return
              </button>
            )}

            {/* DOWNLOAD */}
            <button
              onClick={downloadInvoice}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Download Invoice
            </button>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}