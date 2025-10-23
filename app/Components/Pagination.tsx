import React, { useState } from "react";

type PaginationProps = {
  totalTodos: number;
  todosPerPage: number;
  setCurrentPage: (page: number) => void;
  currentPage: number;
};

const Pagination: React.FC<PaginationProps> = ({
  totalTodos,
  todosPerPage,
  setCurrentPage,
  currentPage,
}) => {
  let pages: number[] = [];

  for (let i = 1; i <= Math.ceil(totalTodos / todosPerPage); i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      {pages.map((page, index) => {
        return (
          <button
            key={index}
            onClick={() => setCurrentPage(page)}
            className={page === currentPage ? "active" : ""}
          >
            {page}
          </button>
        );
      })}
    </div>
  );
};

export default Pagination;
