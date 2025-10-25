import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-light text-center py-3 mt-auto">
      <div className="container">
        <small className="text-muted">prowessityVLMS &copy; {year}</small>
      </div>
    </footer>
  );
}