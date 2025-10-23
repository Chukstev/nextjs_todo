import React, { useState, useEffect } from "react";
import { FaTrash, FaSave, FaEdit, FaTimes } from "react-icons/fa";
import type { Todo } from "../types";
import type { UseMutationResult } from "@tanstack/react-query";

type TodoModalProps = {
  todo: Todo | null;
  onClose: () => void;
  handleDelete: (id: number) => void;
  editTodo: UseMutationResult<
    unknown,
    unknown,
    { id: number; title: string },
    unknown
  >;
};

const TodoModal: React.FC<TodoModalProps> = ({
  todo,
  onClose,
  handleDelete,
  editTodo,
}) => {
  if (!todo) return null; // If no todo is selected, don't render the modal

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>(todo.title);

  useEffect(() => {
    setEditTitle(todo.title);
  }, [todo.title]);

  const handleSave = () => {
    if (!editTitle.trim()) return;
    editTodo.mutate({ id: todo.id, title: editTitle });
    setIsEditing(false);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Todo Details</h2>
        <p>ID: {todo.id}</p>
        <p>Status: {todo.completed ? "Completed" : "Pending"}</p>
        <div className="edit-field">
          {isEditing ? (
            <div>
              <input
                type="text"
                value={editTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditTitle(e.target.value)
                }
              />
              <button className="save-btn" onClick={handleSave}>
                <FaSave size={20} />
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setEditTitle(todo.title);
                  setIsEditing(false);
                }}
              >
                <FaTimes size={20} />
              </button>
            </div>
          ) : (
            <div>
              <p>Title: {editTitle}</p>
            </div>
          )}
        </div>
        <div className="buttons">
          <button className="green" onClick={() => setIsEditing(true)}>
            <FaEdit size={20} />
          </button>
          {/* <button
        className="black"
          onClick={() => {
            handleDelete(todo.id);
            onClose();
          }}
        >
         <FaTrash size={20} />
        </button> */}
          <button className="red" onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoModal;
