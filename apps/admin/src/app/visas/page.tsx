"use client";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useRole } from "@/components/RoleContext";
import { Search, Plus, Plane, Calendar, User, FileText, CheckCircle2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type VisaTask = {
  id: string;
  student: string;
  destination: string;
  course: string;
  date: string;
};

type ColumnData = {
  title: string;
  items: VisaTask[];
};

type ColumnsState = {
  [key: string]: ColumnData;
};

const initialColumns: ColumnsState = {
  "doc-prep": {
    title: "Document Prep",
    items: []
  },
  "applied": {
    title: "Visa Applied",
    items: []
  },
  "interview": {
    title: "Interview Scheduled",
    items: []
  },
  "approved": {
    title: "Visa Approved 🎉",
    items: []
  }
};

export default function VisasPage() {
  const [columns, setColumns] = useState<ColumnsState>(initialColumns);
  const [search, setSearch] = useState("");
  const { role } = useRole();

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    if (source.droppableId !== destination.droppableId) {
      const sourceCol = columns[source.droppableId];
      const destCol = columns[destination.droppableId];
      const sourceItems = [...sourceCol.items];
      const destItems = [...destCol.items];
      const [removed] = sourceItems.splice(source.index, 1);
      
      destItems.splice(destination.index, 0, removed);
      
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
        [destination.droppableId]: { ...destCol, items: destItems }
      });
      toast.success(`${removed.student} moved to ${destCol.title}`);
    } else {
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      
      setColumns({
        ...columns,
        [source.droppableId]: { ...column, items: copiedItems }
      });
    }
  };

  const handleDelete = (columnId: string, itemId: string) => {
    if (role !== "owner") {
      toast.error("Access Denied: Only Admin or Owner can delete records.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this record?")) return;
    const column = columns[columnId];
    const newItems = column.items.filter(item => item.id !== itemId);
    setColumns({
      ...columns,
      [columnId]: { ...column, items: newItems }
    });
    toast.success("Visa case deleted successfully");
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Visa Processing Pipeline</h1>
          <p className="text-slate-500">Track student visa applications from document prep to approval.</p>
        </div>
        <button className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={18} /> New Visa Case
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search students..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-max pb-4">
            {Object.entries(columns).map(([id, column]) => (
              <div key={id} className="w-80 flex flex-col bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 rounded-t-2xl">
                  <h3 className="font-bold text-slate-800 dark:text-white">{column.title}</h3>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded-full">
                    {column.items.length}
                  </span>
                </div>
                
                <Droppable droppableId={id}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      {column.items.filter(item => item.student.toLowerCase().includes(search.toLowerCase())).map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white dark:bg-slate-900 p-4 rounded-xl border ${snapshot.isDragging ? 'border-primary shadow-lg ring-2 ring-primary/20 scale-105 z-50' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'} transition-all group`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800 dark:text-white">{item.student}</h4>
                                <button
                                  onClick={() => handleDelete(id, item.id)}
                                  className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                  <Plane size={14} className="text-blue-500" />
                                  <span>{item.destination}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                  <FileText size={14} className="text-purple-500" />
                                  <span className="truncate">{item.course}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                  {id === 'approved' ? (
                                    <CheckCircle2 size={14} className="text-green-500" />
                                  ) : (
                                    <Calendar size={14} className="text-orange-500" />
                                  )}
                                  <span>{item.date}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
