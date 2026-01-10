import React, { useEffect, useState } from "react";
import {
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  collection,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";
import { AddTeacherPopup } from "../component/TeacherAdd";
import SalaryReceipt from "../component/SalaryReceipt";

/* ================= MONTHS (JANUARY–DECEMBER) ================= */
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function TeachersManagementPage() {
  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [teachers, setTeachers] = useState([]);
  const [holidays, setHolidays] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);

  /* RECEIPT STATE */
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  /* ================= LOAD TEACHERS ================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teachers"), (snap) => {
      setTeachers(
        snap.docs.map((d) => ({
          id: d.id,
          attendance: d.data().attendance || {},
          salaryDetails: d.data().salaryDetails || {},
          ...d.data(),
        }))
      );
    });
    return unsub;
  }, []);

  /* ================= LOAD HOLIDAYS FROM METADATA ================= */
  useEffect(() => {
    const fetchHolidays = async () => {
      const holidayDocRef = doc(db, "metadata", `teacher_holidays_${month}`);
      const docSnap = await getDoc(holidayDocRef);
      if (docSnap.exists()) {
        setHolidays(docSnap.data());
      } else {
        setHolidays({});
      }
    };
    fetchHolidays();
  }, [month]);

  /* ================= HELPERS ================= */
  const getDaysInMonth = (m) => {
    const year = new Date().getFullYear();
    const monthIdx = months.indexOf(m);
    return new Date(year, monthIdx + 1, 0).getDate();
  };

  const isSunday = (day, m) => {
    const year = new Date().getFullYear();
    const monthIdx = months.indexOf(m);
    return new Date(year, monthIdx, day).getDay() === 0;
  };

  /* ================= CALCULATION LOGIC ================= */
  const getCalculatedData = (teacher, currentMonth) => {
    const totalDays = getDaysInMonth(currentMonth);
    let absentCount = 0;
    let presentCount = 0;
    let holidayAndSundayCount = 0;

    for (let i = 1; i <= totalDays; i++) {
      const dateKey = `${currentMonth}_day_${i}`;
      const holidayKey = `day_${i}`;
      const status = teacher.attendance?.[dateKey];

      if (status === "A") {
        absentCount++;
      } else if (status === "P") {
        presentCount++;
      } else if (isSunday(i, currentMonth) || holidays[holidayKey]) {
        holidayAndSundayCount++;
      }
    }

    const monthlySalary = Number(teacher.salary) || 0;
    const perDayRate = monthlySalary / totalDays;
    
    // Formula: No deduction for Holidays or Sundays. Only 'A' marks deduct salary.
    const deduction = Math.round(absentCount * perDayRate);
    const finalPayable = monthlySalary - deduction;

    return { 
      present: presentCount, 
      absent: absentCount, 
      paidHolidays: holidayAndSundayCount, 
      deduction, 
      finalPayable,
      monthlySalary 
    };
  };

  /* ================= PAY SALARY ACTION ================= */
  const handlePay = (teacher, finalSalary) => {
    toast((t) => (
      <div className="text-sm p-1">
        <p className="font-semibold mb-2">
          Pay <b>₹{finalSalary}</b> to {teacher.name} for <b>{month}</b>?
        </p>
        <div className="flex gap-2">
          <button
            className="bg-green-600 text-white px-3 py-1 rounded font-bold transition-all hover:bg-green-700"
            onClick={async () => {
              try {
                await updateDoc(doc(db, "teachers", teacher.id), {
                  [`salaryDetails.${month}.total`]: finalSalary,
                  [`salaryDetails.${month}.paid`]: finalSalary,
                  [`salaryDetails.${month}.paidAt`]: serverTimestamp(),
                });
                toast.dismiss(t.id);
                toast.success(`${month} Salary Paid Successfully`);
              } catch (e) {
                toast.error("Error paying salary");
              }
            }}
          >
            Confirm
          </button>
          <button
            className="bg-gray-200 px-3 py-1 rounded"
            onClick={() => toast.dismiss(t.id)}
          >
            No
          </button>
        </div>
      </div>
    ), { duration: 4000 });
  };

  /* ================= DELETE ACTION ================= */
  const handleDelete = async (id) => {
    if (window.confirm("Do you really want to delete this teacher?")) {
      await deleteDoc(doc(db, "teachers", id));
      toast.success("Teacher deleted");
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Teacher Payroll</h1>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border-2 border-slate-200 bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            {months.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 transition-all active:scale-95"
          onClick={() => {
            setEditTeacher(null);
            setShowAdd(true);
          }}
        >
          <span className="text-xl">+</span> Add Teacher
        </button>
      </div>

      {/* ================= POPUP ================= */}
      {showAdd && (
        <AddTeacherPopup
          close={() => setShowAdd(false)}
          editData={editTeacher}
        />
      )}

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-white text-[11px] uppercase tracking-widest">
            <tr>
              <th className="p-4">Teacher Profile</th>
              <th className="p-4 text-center">Attd (P / A / H+S)</th>
              <th className="p-4">Base Salary</th>
              <th className="p-4">Deduction (A)</th>
              <th className="p-4">Net Payable</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {teachers.map((t) => {
              const data = getCalculatedData(t, month);
              const salaryInfo = t.salaryDetails?.[month];
              const isPaid = Boolean(salaryInfo?.paidAt);

              return (
                <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">{t.name?.[0]}</div>
                    <div>
                      <div className="font-bold text-slate-700">{t.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{t.subject}</div>
                    </div>
                  </td>

                  <td className="p-4 text-center text-xs font-bold">
                    <span className="text-green-600">{data.present}P</span> / 
                    <span className="text-red-500 mx-1">{data.absent}A</span> / 
                    <span className="text-blue-500">{data.paidHolidays}H</span>
                  </td>

                  <td className="p-4 font-semibold text-slate-600">₹{data.monthlySalary}</td>
                  <td className="p-4 text-red-400 font-medium">- ₹{data.deduction}</td>
                  <td className="p-4 font-black text-blue-600 text-lg">₹{data.finalPayable}</td>

                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isPaid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    }`}>
                      {isPaid ? "Paid" : "Pending"}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      {!isPaid ? (
                        <button
                          onClick={() => handlePay(t, data.finalPayable)}
                          className="bg-slate-800 text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-slate-900 transition-all active:scale-90"
                        >
                          PAY NOW
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setReceiptData({ teacher: t, month, salaryInfo });
                            setShowReceipt(true);
                          }}
                          className="border-2 border-blue-600 text-blue-600 text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-blue-50 transition-all"
                        >
                          RECEIPT
                        </button>
                      )}
                      <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="md:hidden space-y-4">
        {teachers.map((t) => {
          const data = getCalculatedData(t, month);
          const salaryInfo = t.salaryDetails?.[month];
          const isPaid = Boolean(salaryInfo?.paidAt);

          return (
            <div key={t.id} className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 relative">
               <span className={`absolute top-4 right-4 px-2 py-1 rounded-full text-[8px] font-black uppercase ${
                  isPaid ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                }`}>
                  {isPaid ? "Paid" : "Pending"}
                </span>

              <div className="flex gap-4 items-center mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">{t.name?.[0]}</div>
                <div>
                  <div className="font-bold text-slate-800">{t.name}</div>
                  <div className="text-xs text-slate-400 font-medium">{t.subject}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 border-t border-slate-50 pt-4 text-xs">
                <div><span className="text-slate-400 block text-[9px] uppercase">Attendance</span> <b className="text-slate-700">{data.present}P / {data.absent}A / {data.paidHolidays}H</b></div>
                <div><span className="text-slate-400 block text-[9px] uppercase">Final Payable</span> <b className="text-blue-600 text-sm">₹{data.finalPayable}</b></div>
              </div>

              <div className="mt-5 flex gap-2">
                {!isPaid ? (
                  <button onClick={() => handlePay(t, data.finalPayable)} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-50 active:scale-95 transition-all">Pay Salary</button>
                ) : (
                  <button onClick={() => { setReceiptData({ teacher: t, month, salaryInfo }); setShowReceipt(true); }} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl active:scale-95 transition-all">View Receipt</button>
                )}
                <button onClick={() => handleDelete(t.id)} className="bg-slate-100 text-slate-400 px-4 rounded-xl">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= RECEIPT MODAL ================= */}
      {showReceipt && receiptData && (
        <SalaryReceipt
          teacherName={receiptData.teacher.name}
          subject={receiptData.teacher.subject}
          phone={receiptData.teacher.phone}
          month={receiptData.month}
          totalAmount={receiptData.salaryInfo.total}
          paidAmount={receiptData.salaryInfo.paid}
          paidAt={receiptData.salaryInfo.paidAt}
          receiptNo={`SAL-${receiptData.month}-${receiptData.teacher.id}`}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}