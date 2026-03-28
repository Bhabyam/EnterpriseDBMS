import { useEffect,useState } from "react";
import axios from "axios";
import { BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid,ResponsiveContainer } from "recharts";

function Dashboard(){

  const [stats,setStats] = useState({});
  const [chart,setChart] = useState([]);

  useEffect(()=>{

    axios.get("http://127.0.0.1:5000/dashboard")
    .then(res=>{
      setStats(res.data.stats);
      setChart(res.data.chart);
    });

  },[]);

  return(

    <div>

      <h2>Dashboard</h2>

      <div className="row mt-4">

        <div className="col-md-4">
          <div className="card shadow p-3">
            <h5>Total Orders</h5>
            <h2>{stats.orders}</h2>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow p-3">
            <h5>Total Revenue</h5>
            <h2>₹{stats.revenue}</h2>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow p-3">
            <h5>Products</h5>
            <h2>{stats.products}</h2>
          </div>
        </div>

      </div>

      <div className="card shadow mt-5 p-3">

        <h5>Orders per Day</h5>

        <ResponsiveContainer width="100%" height={300}>

          <BarChart data={chart}>

            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date"/>
            <YAxis/>
            <Tooltip/>
            <Bar dataKey="orders" fill="#0d6efd"/>

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}

export default Dashboard;