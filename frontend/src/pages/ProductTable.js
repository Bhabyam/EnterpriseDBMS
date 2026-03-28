import React from "react";

function ProductTable({ products }) {

  return (

    <table className="table table-striped table-bordered">

      <thead className="table-dark">
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Category</th>
          <th>Brand</th>
          <th>Price</th>
          <th>GST</th>
        </tr>
      </thead>

      <tbody>

        {products.map((p, index) => (
          <tr key={index}>
            <td>{p[0]}</td>
            <td>{p[1]}</td>
            <td>{p[2]}</td>
            <td>{p[3]}</td>
            <td>₹{p[4]}</td>
            <td>{p[5]}%</td>
          </tr>
        ))}

      </tbody>

    </table>

  );

}

export default React.memo(ProductTable);