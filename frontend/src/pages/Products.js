import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import ProductTable from "./ProductTable";

function Products() {

  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // fetch products
  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/products")
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  // debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // memo filter
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p[1].toLowerCase().includes(search.toLowerCase()) ||
      p[2].toLowerCase().includes(search.toLowerCase()) ||
      p[3].toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  return (

    <div className="container mt-4">

      <h2>Product Catalogue</h2>

      {/* FAST INPUT */}
      <input
        type="text"
        placeholder="Search by name, category or brand..."
        className="form-control mt-3 mb-3"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      {/* TABLE (separate component) */}
      <ProductTable products={filteredProducts} />

    </div>

  );

}

export default Products;