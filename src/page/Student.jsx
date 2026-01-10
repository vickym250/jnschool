import React, { useState, useEffect } from "react";
import AddStudent from "../component/AddStudent";
import FeesReceipt from "../component/Fess";
import Readmission from "../component/Readmission"; 
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { updateTotalStudents } from "../component/updateTotalStudents";

export default function StudentList() {
  let navigator = useNavigate();
  
  // 🔥 Settings
  const CURRENT_ACTIVE_SESSION = "2025-26"; 
  const sessions = ["2024-25", "2025-26", "2026-27"];
  const [session, setSession] = useState("2025-26");
  const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
  const [month, setMonth] = useState("April");
  const schoolClasses = ["LKG", "UKG", ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)];
  const [className, setClassName] = useState("Class 10");

  const [open, setOpen] = useState(false);
  const [openRe, setOpenRe] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptStudent, setReceiptStudent] = useState(null);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Data Fetching
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => !s.deletedAt);
      setStudents(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter Logic
  const filteredStudents = students
    .filter((s) => {
      const matchSession = s.session === session; 
      const matchClass = s.className === className;
      const matchSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.rollNumber?.toString().includes(searchTerm);
      return matchSession && matchClass && matchSearch;
    })
    .sort((a, b) => parseInt(a.rollNumber || 0) - parseInt(b.rollNumber || 0));

  const handleReAdmission = (student) => {
    setEditStudent(student); 
    setOpenRe(true); 
  };

  // 🔥 Fees Payment with Session Logic
  const handlePayFees = async (student) => {
    // Current selected session ka data nikalein
    const sessionFees = student.fees?.[session] || {};
    const monthData = sessionFees[month] || {};

    const schoolAmt = Number(monthData.schoolPart || student.totalFees || 0);
    const busAmt = student.isBusStudent ? Number(monthData.busPart || student.busFees || 0) : 0;

    let paySchool = true;
    let payBus = student.isBusStudent;

    toast((t) => (
      <div className="p-2 min-w-[220px]">
        <p className="font-bold text-gray-800 mb-1 border-b pb-1 text-sm uppercase text-center">Fees: {month}</p>
        <p className="text-[10px] text-center text-blue-600 font-bold mb-2 uppercase">Session: {session}</p>
        <div className="space-y-2 mb-4 text-left">
          <label className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-blue-50 rounded">
            <input type="checkbox" defaultChecked={paySchool} onChange={(e) => paySchool = e.target.checked} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm font-semibold text-gray-700">School: ₹{schoolAmt}</span>
          </label>
          {student.isBusStudent && (
            <label className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-blue-50 rounded">
              <input type="checkbox" defaultChecked={payBus} onChange={(e) => payBus = e.target.checked} className="w-4 h-4 accent-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Bus: ₹{busAmt}</span>
            </label>
          )}
        </div>
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 text-white py-2 rounded font-bold text-xs uppercase"
            onClick={async () => {
              if (!paySchool && !payBus) { toast.error("Select at least one!"); return; }
              try {
                // 🔥 Database path: fees -> [session] -> [month]
                const updateObj = { [`fees.${session}.${month}.paidAt`]: serverTimestamp() };
                if (paySchool) updateObj[`fees.${session}.${month}.paidSchool`] = schoolAmt;
                if (payBus) updateObj[`fees.${session}.${month}.paidBus`] = busAmt;
                
                await updateDoc(doc(db, "students", student.id), updateObj);
                toast.dismiss(t.id);
                toast.success(`Fees paid for ${session}`);
              } catch (err) { toast.error("Error!"); }
            }}
          >Confirm</button>
          <button className="flex-1 bg-gray-100 text-gray-500 py-2 rounded font-bold text-xs uppercase" onClick={() => toast.dismiss(t.id)}>Cancel</button>
        </div>
      </div>
    ), { duration: 10000, position: "top-center" });
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Archive student?")) return;
    await updateDoc(doc(db, "students", id), { deletedAt: serverTimestamp() });
    toast.success("Archived");
    await updateTotalStudents();
  };

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen font-sans">
      <div className={`max-w-[1400px] mx-auto ${(open || openRe) ? "blur-md pointer-events-none" : ""}`}>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-800">Student List ({session})</h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <select value={session} onChange={(e) => setSession(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-bold bg-white outline-none">
            {sessions.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-bold bg-white outline-none">
            {months.map(m => <option key={m}>{m}</option>)}
          </select>
          <select value={className} onChange={(e) => setClassName(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-bold bg-white outline-none">
            {schoolClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
          <div className="flex-grow">
            <input type="text" placeholder="Search by name or roll..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-1.5 text-sm outline-none" />
          </div>
          <button onClick={() => { setEditStudent(null); setOpen(true); }} className="bg-[#FFC107] text-black px-5 py-1.5 rounded-md font-bold text-sm shadow hover:bg-amber-500 uppercase">Add Student</button>
        </div>

        {/* ✅ Table Wrapper for Horizontal Scroll */}
        <div className="border border-gray-200 rounded-lg overflow-x-auto shadow-sm bg-white">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-[#E2E8F0] text-[#475569] text-[12px] font-bold uppercase tracking-tight">
              <tr>
                <th className="px-4 py-4">Photo</th>
                <th className="px-4 py-4 text-center">Roll</th>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Class</th>
                <th className="px-4 py-4 text-center">Total</th>
                <th className="px-4 py-4 text-center">Paid</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((s) => {
                // 🔥 Session wise calculation
                const sessionFee = s.fees?.[session]?.[month] || {};
                const schoolPart = Number(sessionFee.schoolPart || s.totalFees || 0);
                const busPart = s.isBusStudent ? Number(sessionFee.busPart || s.busFees || 0) : 0;
                const totalAmt = schoolPart + busPart;
                const totalPaid = Number(sessionFee.paidSchool || 0) + Number(sessionFee.paidBus || 0);
                const isSchoolPaid = Number(sessionFee.paidSchool || 0) >= schoolPart && schoolPart > 0;
                const isFullPaid = totalPaid >= totalAmt && totalAmt > 0;

                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 text-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-50 mx-auto">
                        {s.photoURL ? <img src={s.photoURL} className="w-full h-full object-cover" alt=""/> : <span className="flex items-center justify-center h-full text-gray-400 font-bold">{s.name?.[0]}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-500 text-center">{s.rollNumber}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-800 uppercase">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.className}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-700 text-center">₹{totalAmt}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-700 text-center">₹{totalPaid}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isFullPaid ? "bg-[#DCFCE7] text-[#166534]" : totalPaid > 0 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                        {isFullPaid ? "PAID" : totalPaid > 0 ? "PARTIAL" : "PENDING"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {s.session === CURRENT_ACTIVE_SESSION ? (
                          <>
                            {isSchoolPaid ? (
                              <button onClick={() => { setReceiptStudent(s); setShowReceipt(true); }} className="bg-[#9333EA] text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-purple-700 uppercase">Receipt</button>
                            ) : (
                              <button onClick={() => handlePayFees(s)} className="bg-[#2563EB] text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-blue-700 uppercase">Pay Now</button>
                            )}
                            <button onClick={() => { setEditStudent(s); setOpen(true); }} className="bg-[#FBBF24] text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-amber-500 uppercase">Edit</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleReAdmission(s)} className="bg-emerald-600 text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-emerald-700 uppercase">New</button>
                            <button onClick={() => navigator(`/tc/${s.id}`)} className="bg-red-600 text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-red-700 uppercase">TC</button>
                          </>
                        )}
                        <button onClick={() => handleDelete(s.id)} className="bg-[#EF4444] text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-red-600 uppercase">Delete</button>
                        <button onClick={() => navigator(`/idcard/${s.id}`)} className="bg-white text-blue-600 border border-blue-600 px-3 py-1 rounded text-[11px] font-bold hover:bg-blue-50 uppercase tracking-tighter">IdCard</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {open && <AddStudent close={() => { setOpen(false); setEditStudent(null); }} editData={editStudent} />}
      {openRe && <Readmission close={() => { setOpenRe(false); setEditStudent(null); }} studentData={editStudent} />}

      {showReceipt && receiptStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowReceipt(false)}>
          <div onClick={(e) => e.stopPropagation()} className="animate-in zoom-in-95 duration-200">
            <FeesReceipt
              studentId={receiptStudent.id}
              name={receiptStudent.name}
              studentClass={receiptStudent.className}
              monthlyFee={receiptStudent.fees?.[session]?.[month]?.paidSchool || 0}
              busFee={receiptStudent.fees?.[session]?.[month]?.paidBus || 0}
              payMonth={`${month} (${session})`}
              paidAt={receiptStudent.fees?.[session]?.[month]?.paidAt}
              onClose={() => setShowReceipt(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}