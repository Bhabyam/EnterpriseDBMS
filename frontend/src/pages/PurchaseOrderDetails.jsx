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

export default function PurchaseOrderDetails() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    API.get(`/api/purchase_orders/${id}`)
      .then(res => {
        setItems(res.data.data.items || []);
        setSummary(res.data.data.summary || null);
      })
      .catch(console.error);
  }, [id]);

  const downloadInvoice = () => {
    const doc = new jsPDF();

    doc.text(`Purchase Order #${summary.po_id}`, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Product", "Qty", "Cost Price", "Subtotal"]],
      body: items.map(i => [
        i.name,
        i.quantity,
        i.cost_price,
        i.sub_total
      ])
    });

    doc.text(
      `Total: Rs.${summary.total_amount}`,
      14,
      doc.lastAutoTable.finalY + 10
    );

    doc.save(`po_${summary.po_id}.pdf`);
  };

  if (!summary) return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>

      <div className="bg-white rounded-xl shadow border overflow-hidden">

        {/* HEADER */}
        <div className="bg-gray-900 text-white p-4 text-lg font-semibold">
          Purchase Order #{summary.po_id}
        </div>

        {/* TABLE */}
        <div className="p-4">

          <table className="w-full text-sm mb-4 text-center">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="py-2">Product</th>
                <th>Qty</th>
                <th>Cost Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {items.map((i, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{i.name}</td>
                  <td>{i.quantity}</td>
                  <td>₹{i.cost_price}</td>
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

            {(summary.status === "Pending" || summary.status === "Confirmed") && (
              <button
                onClick={() => navigate(`/supplier_payments?po_id=${id}`)}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Add Payment
              </button>
            )}

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