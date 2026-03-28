import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { useState } from "react";
import adminImg from "./assets/admin.jpg";

import { FaBox, FaShoppingCart, FaMoneyBill, FaChartBar, FaClipboardList, FaBars,FaUndo } from "react-icons/fa";

import Products from "./pages/Products";
import PlaceOrder from "./pages/PlaceOrder";
import AddPayment from "./pages/AddPayment";
import OrderHistory from "./pages/OrderHistory";
import OrderDetails from "./pages/OrderDetails";
import Dashboard from "./pages/Dashboard";
import Returns from "./pages/Returns";

function App() {

  const [collapsed,setCollapsed] = useState(false);
  const [showProfile,setShowProfile] = useState(false);

  return (
    <Router>

      <div className="app-layout">

        {/* SIDEBAR */}

        <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>

          <h3 className="logo">Retail</h3>

          <NavLink to="/dashboard" className="nav-item">
            <FaChartBar/> <span>Dashboard</span>
          </NavLink>

          <NavLink to="/products" className="nav-item">
            <FaBox/> <span>Products</span>
          </NavLink>

          <NavLink to="/order" className="nav-item">
            <FaShoppingCart/> <span>Place Order</span>
          </NavLink>

          <NavLink to="/payment" className="nav-item">
            <FaMoneyBill/> <span>Payment</span>
          </NavLink>

          <NavLink to="/orders" className="nav-item">
            <FaClipboardList/> <span>Orders</span>
          </NavLink>
           
          <NavLink to="/returns" className="nav-item">
            <FaUndo/> <span>Returns</span>
          </NavLink>

        </div>


        {/* MAIN AREA */}

        <div className="main">

          {/* HEADER */}

          <div className="header">

            <FaBars
              className="menu-btn"
              onClick={()=>setCollapsed(!collapsed)}
            />

            <div
              className="profile"
              onClick={()=>setShowProfile(!showProfile)}
            >

              <span>Admin</span>

              <img
                src={adminImg}
                alt="admin"
                className="profile-img"
              />

              {showProfile && (

                <div className="profile-dropdown">

                  <div className="profile-header">

                    <img
                      src={adminImg}
                      alt="admin"
                      className="profile-big"
                    />

                    <h4>Admin</h4>
                    <p>Retail Administrator</p>

                  </div>

                  <div className="profile-menu">

                    <button>Profile</button>
                    <button>Settings</button>
                    <button className="logout">Logout</button>

                  </div>

                </div>

              )}

            </div>

          </div>


          {/* CONTENT */}

          <div className="content page-transition">

            <Routes>

              <Route path="/dashboard" element={<Dashboard/>}/>
              <Route path="/products" element={<Products/>}/>
              <Route path="/order" element={<PlaceOrder/>}/>
              <Route path="/payment" element={<AddPayment/>}/>
              <Route path="/orders" element={<OrderHistory/>}/>
              <Route path="/orders/:id" element={<OrderDetails/>}/>
              <Route path="/returns" element={<Returns/>}/>
            </Routes>

          </div>

        </div>

      </div>

    </Router>
  );
}

export default App;