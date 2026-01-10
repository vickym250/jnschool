import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  setDoc 
} from "firebase/firestore";
import toast from "react-hot-toast";
import { UserCheck, ChevronRight } from "lucide-react";

export default function TeacherAttendance() {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [month, setMonth] = useState(months[new Date().getMonth()]);
  const [teachers, setTeachers] = useState([]);
  const [holidays, setHolidays] = useState({});
  const [activeTooltip, setActiveTooltip] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "teachers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeachers(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const holidayDocRef = doc(db, "metadata", `teacher_holidays_${month}`);
    const unsubHolidays = onSnapshot(holidayDocRef, (docSnap) => {
      setHolidays(docSnap.exists() ? docSnap.data() : {});
    });
    return () => unsubHolidays();
  }, [month]);

  const getDaysInMonth = () => {
    const m = months.indexOf(month);
    const year = new Date().getFullYear();
    return new Date(year, m + 1, 0).getDate();
  };

  const isSunday = (day) => {
    const year = new Date().getFullYear();
    const m = months.indexOf(month);
    return new Date(year, m, day).getDay() === 0;
  };

  const toggleHoliday = async (day) => {
    if (isSunday(day)) return toast.error("Sunday is default holiday");
    const dayKey = `day_${day}`;
    if (holidays[dayKey]) {
      toast.error("Holiday is already locked!");
      return;
    }

    let holidayReason = prompt(`Enter Holiday Reason for Day ${day}:`);
    if (!holidayReason) return;

    try {
      await setDoc(doc(db, "metadata", `teacher_holidays_${month}`), { 
        [dayKey]: true, [`${dayKey}_reason`]: holidayReason 
      }, { merge: true });
      toast.success("Locked!");
    } catch (e) { toast.error("Error!"); }
  };

  const markAttendance = async (teacher, day, status) => {
    if (holidays[`day_${day}`] || isSunday(day)) {
      toast.error("Day is Locked!");
      return;
    }
    const dateKey = `${month}_day_${day}`;
    if (teacher.attendance?.[dateKey]) {
      toast.error("Locked!");
      return;
    }
    try {
      await updateDoc(doc(db, "teachers", teacher.id), {
        [`attendance.${dateKey}`]: status,
      });
      toast.success(`${status} marked`);
    } catch (err) {
      toast.error("Error");
    }
  };

  return (
    <div className="container mx-auto rounded-2xl shadow-xl overflow-hidden" onClick={() => setActiveTooltip(null)}>
      <div className="w-full relative">
        
        {/* HEADER */}
        <div className="flex-none bg-white p-3 md:p-5 rounded-xl shadow-sm border mb-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="bg-blue-600 p-2 rounded-lg text-white shrink-0">
              <UserCheck size={20} />
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">Teacher Attendance</h2>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full sm:w-auto border-2 px-3 py-1.5 rounded-lg bg-slate-50 font-bold text-slate-700 outline-none text-sm focus:border-blue-500 transition-all cursor-pointer"
            >
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* TABLE AREA */}
        <div className="flex-1 min-h-0 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col relative">
          <div className="overflow-auto relative grow scrollbar-hide">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-30 shadow-sm">
                <tr className="bg-slate-50">
                  <th className="p-3 text-left border-b border-r sticky top-0 left-0 bg-slate-50 z-40 min-w-[130px] sm:min-w-[180px] text-slate-600 font-bold text-[10px] md:text-xs uppercase tracking-wider">
                    Teacher Name
                  </th>
                  {[...Array(getDaysInMonth())].map((_, i) => {
                    const day = i + 1;
                    const sun = isSunday(day);
                    const isH = holidays[`day_${day}`] || sun;
                    return (
                      <th key={i} className={`p-2 border-b border-r text-center sticky top-0 z-20 min-w-[42px] ${sun ? 'bg-red-50' : 'bg-slate-50'}`}>
                        <span className="text-[10px] font-black text-slate-500 block">{day}</span>
                        <button 
                          onClick={() => toggleHoliday(day)}
                          className={`mt-1 text-[8px] px-1 rounded border leading-tight transition-all active:scale-95 ${sun ? 'bg-red-600 text-white border-red-700' : isH ? 'bg-red-500 text-white border-red-600' : 'bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300'}`}
                        >
                          {sun ? 'S' : isH ? 'H' : 'D'}
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-2 md:p-3 border-r sticky left-0 bg-white z-20 flex items-center gap-2 shadow-[2px_0_5px_rgba(0,0,0,0.05)] font-bold text-slate-700 text-[10px] md:text-xs">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-100 border shrink-0 flex items-center justify-center font-bold text-blue-500 overflow-hidden">
                        {teacher.photoURL ? <img src={teacher.photoURL} className="w-full h-full object-cover" alt="t" /> : teacher.name?.[0]}
                      </div>
                      <span className="truncate max-w-[80px] sm:max-w-none">{teacher.name}</span>
                    </td>

                    {[...Array(getDaysInMonth())].map((_, i) => {
                      const day = i + 1;
                      const sun = isSunday(day);
                      const dayKey = `day_${day}`;
                      const isH = holidays[dayKey] || sun;
                      const dateKey = `${month}_day_${day}`;
                      const status = teacher.attendance?.[dateKey] || "";
                      const reason = sun ? "Sunday Holiday" : (holidays[`${dayKey}_reason`] || "School Holiday");
                      const tooltipKey = `${teacher.id}_${day}`;

                      return (
                        <td 
                          key={i} 
                          className={`p-1 border-r text-center h-10 md:h-12 min-w-[42px] relative group/cell ${isH ? 'bg-red-50/50' : ''}`}
                          onMouseEnter={() => isH && setActiveTooltip(tooltipKey)}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          {isH ? (
                            <div 
                              className="w-full h-full flex items-center justify-center cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTooltip(activeTooltip === tooltipKey ? null : tooltipKey);
                              }}
                            >
                              <span className={`text-[8px] font-black rotate-[-90deg] uppercase tracking-tighter ${sun ? 'text-red-700' : 'text-red-500'}`}>
                                {sun ? 'SUN' : 'HOL'}
                              </span>

                              {/* 🚀 FIXED REASON TOOLTIP (Z-index 999 to stay on top) */}
                              {activeTooltip === tooltipKey && (
                                <div className="fixed z-[999] -translate-y-[85px] -translate-x-1/2 left-1/2 md:absolute md:-translate-y-24 md:left-1/2 pointer-events-none">
                                  <div className="bg-slate-900 text-white border border-slate-700 rounded-xl shadow-2xl p-4 min-w-[160px] max-w-[240px] text-center animate-in fade-in zoom-in duration-200 backdrop-blur-md bg-opacity-95">
                                    <div className="text-[9px] font-bold text-red-400 uppercase mb-2 tracking-widest border-b border-slate-700 pb-1 flex items-center justify-center gap-2">🚩 Reason</div>
                                    <div className="text-sm font-bold text-slate-100 leading-snug italic py-1">"{reason}"</div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-900"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            status ? (
                              <div className={`w-full h-7 md:h-8 flex items-center justify-center rounded font-black text-white text-[9px] md:text-[10px] shadow-sm ${status === 'P' ? 'bg-green-500' : 'bg-red-500'}`}>
                                {status}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5 items-center justify-center">
                                <button onClick={() => markAttendance(teacher, day, "P")} className="w-8 h-3.5 md:h-4 text-[7px] md:text-[8px] font-bold rounded bg-slate-100 text-slate-400 hover:bg-green-500 hover:text-white transition-all active:scale-95">P</button>
                                <button onClick={() => markAttendance(teacher, day, "A")} className="w-8 h-3.5 md:h-4 text-[7px] md:text-[8px] font-bold rounded bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white transition-all active:scale-95">A</button>
                              </div>
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-none p-3 flex flex-wrap gap-x-4 gap-y-2 justify-center items-center text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white mt-2 rounded-lg border">
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div><span>Present</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div><span>Absent</span></div>
           <div className="hidden sm:block text-slate-300">|</div>
           <div className="flex items-center gap-1 text-slate-400 font-normal italic lowercase"><ChevronRight size={10} /> Scroll right for all dates</div>
        </div>

      </div>
    </div>
  );
}