import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { doc, setDoc, getDoc } from "firebase/firestore"; 

const ExamTimetable = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Initial Fetch Loader
  const [selectedClass, setSelectedClass] = useState("Class 10"); 
  
  const availableClasses = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

  const subjectsByClass = {
    "Class 1": ["Maths", "English", "Hindi", "EVS"],
    "Class 2": ["Maths", "English", "Hindi", "EVS"],
    "Class 3": ["Maths", "English", "Hindi", "Science"],
    "Class 4": ["Maths", "English", "Hindi", "Science"],
    "Class 5": ["Maths", "English", "Hindi", "Science"],
    "Class 6": ["Maths", "English", "Hindi", "Science", "Sanskrit"],
    "Class 7": ["Maths", "English", "Hindi", "Science", "Sanskrit"],
    "Class 8": ["Maths", "English", "Hindi", "Science", "Sanskrit"],
    "Class 9": ["Maths", "Science", "Social Science", "English", "Hindi"],
    "Class 10": ["Maths", "Science", "Social Science", "English", "Hindi"],
    "Class 11": ["Physics", "Chemistry", "Maths", "Biology", "English"],
    "Class 12": ["Physics", "Chemistry", "Maths", "Biology", "English"]
  };

  const [formData, setFormData] = useState({ 
    date: '', day: '', time: '', subject: subjectsByClass["Class 10"][0]
  });

  // 1. Fetch Data Logic with Loader
  useEffect(() => {
    const fetchClassExams = async () => {
      setFetching(true);
      try {
        const docRef = doc(db, "Timetables", selectedClass);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const sortedExams = docSnap.data().exams.sort((a, b) => new Date(a.date) - new Date(b.date));
          setExams(sortedExams);
        } else {
          setExams([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => setFetching(false), 500); // Smooth transition
      }
    };
    fetchClassExams();
    setFormData(prev => ({ ...prev, subject: subjectsByClass[selectedClass][0] }));
  }, [selectedClass]);

  // Auto-Day Detection
  useEffect(() => {
    if (formData.date) {
      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(formData.date));
      setFormData(prev => ({ ...prev, day: dayName }));
    }
  }, [formData.date]);

  const addToList = (e) => {
    e.preventDefault();
    if(!formData.date) return alert("Pehle date toh select karo bhai!");
    const newEntry = { ...formData, id: Date.now() };
    setExams([...exams, newEntry]);
    setFormData({ ...formData, date: '', day: '',  });
  };

  const saveToDatabase = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "Timetables", selectedClass);
      await setDoc(docRef, { exams: exams }, { merge: true });
      alert(`✅ ${selectedClass} Timetable Synced!`);
    } catch (e) {
      alert("Error saving!");
    } finally {
      setLoading(false);
    }
  };

  const removeEntry = (id) => {
    setExams(exams.filter(exam => exam.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 font-sans text-slate-800">
      
      {/* 🟢 FULL SCREEN LOADER */}
      {fetching && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 font-bold text-indigo-900 animate-pulse uppercase tracking-widest text-xs">Fetching Timetable...</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          table { width: 100% !important; border: 1.5px solid #000 !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #000 !important; padding: 12px !important; color: #000 !important; }
        }
      `}} />

      <div className="max-w-6xl mx-auto">
        
        {/* Top Navigation / Header */}
        <div className="no-print flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent uppercase tracking-tight">
              Exam Planner
            </h1>
            <p className="text-slate-400 text-sm font-medium">Manage and generate official date sheets</p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <span className="pl-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Class</span>
            <select 
              className="p-3 pr-10 border-none bg-white rounded-xl font-bold text-indigo-600 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer appearance-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Form (4 Columns) */}
          <div className="no-print lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100/50 border border-indigo-50">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-indigo-900">
                <span className="flex h-8 w-8 items-center justify-center bg-indigo-100 text-indigo-600 rounded-full text-sm">＋</span>
                Add New Exam
              </h3>
              
              <form onSubmit={addToList} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1 mb-2">Exam Date</label>
                  <input type="date" className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1 mb-2">Subject</label>
                  <select className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all appearance-none" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                      {subjectsByClass[selectedClass].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase ml-1 mb-2">Timing</label>
                  <input placeholder="09:00 AM - 12:00 PM" className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-widest text-sm">
                  Add to List
                </button>
              </form>
            </div>
          </div>

          {/* Right Side: Table (8 Columns) */}
          <div className="lg:col-span-8">
            <div id="print-area" className="bg-white p-2 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 min-h-[500px]">
                
                {/* Print Header */}
                <div className="hidden print:block text-center mb-10">
                    <h1 className="text-5xl font-black text-slate-900 mb-2">EXAMINATION DATE SHEET</h1>
                    <div className="h-1 w-32 bg-indigo-600 mx-auto mb-4"></div>
                    <p className="text-2xl font-bold text-slate-700 uppercase tracking-[0.2em]">{selectedClass} | 2024-2025</p>
                </div>

                {exams.length > 0 ? (
                  <div className="overflow-x-auto rounded-3xl border border-slate-100">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-5 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Date & Day</th>
                          <th className="p-5 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Subject Name</th>
                          <th className="p-5 font-bold text-[10px] text-slate-400 uppercase tracking-widest">Timing</th>
                          <th className="no-print p-5 font-bold text-[10px] text-slate-400 uppercase tracking-widest text-center">Manage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {exams.map((item, index) => (
                          <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="p-5">
                              <div className="font-bold text-indigo-600 group-hover:scale-105 transition-transform origin-left">{item.date}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">{item.day}</div>
                            </td>
                            <td className="p-5">
                              <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-700 uppercase">{item.subject}</span>
                            </td>
                            <td className="p-5 font-semibold text-slate-500 italic text-sm">{item.time || "TBD"}</td>
                            <td className="no-print p-5 text-center">
                              <button onClick={() => removeEntry(item.id)} className="opacity-0 group-hover:opacity-100 bg-red-50 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-500 hover:text-white transition-all transform hover:scale-110">
                                DELETE
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                    <div className="text-6xl mb-4">🗓️</div>
                    <p className="font-bold uppercase tracking-widest text-sm">No Exams Scheduled</p>
                  </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="no-print mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={saveToDatabase} 
                disabled={loading} 
                className="flex-1 bg-emerald-500 text-white py-5 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:bg-slate-200"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : "💾 SAVE TO DATABASE"}
              </button>

              <button 
                onClick={() => window.print()} 
                className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-3"
              >
                🖨️ GENERATE PDF
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExamTimetable;