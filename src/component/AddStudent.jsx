import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateTotalStudents } from "./updateTotalStudents";
import AdmissionDetails from "./AdmisionForm";

export default function AddStudent({ close, editData }) {
  const [lang, setLang] = useState("en");

  const translations = {
    en: {
      title: "Admission",
      editTitle: "Edit Student Details",
      studentInfo: "Student Info",
      parentInfo: "Parent Info",
      feesInfo: "Fees & Address",
      name: "Full Name",
      gender: "Gender",
      category: "Category",
      aadhaar: "Aadhaar Number",
      isTransfer: "Is this a Transfer Student?",
      pnrLabel: "UDISE+ PEN/PNR Number",
      saveBtn: "SAVE & PRINT FORM",
      updateBtn: "UPDATE DETAILS",
      busLabel: "Bus Facility Required?",
      busFeeLabel: "Monthly Bus Fee",
      admDate: "Admission Date"
    },
    hi: {
      title: "प्रवेश (Admission)",
      editTitle: "छात्र विवरण संपादित करें",
      studentInfo: "छात्र की जानकारी",
      parentInfo: "अभिभावक की जानकारी",
      feesInfo: "फीस और पता",
      name: "पूरा नाम",
      gender: "लिंग",
      category: "श्रेणी (Category)",
      aadhaar: "आधार नंबर",
      isTransfer: "क्या यह ट्रांसफर छात्र है?",
      pnrLabel: "UDISE+ PEN/PNR नंबर",
      saveBtn: "फॉर्म सुरक्षित करें और प्रिंट करें",
      updateBtn: "विवरण अपडेट करें",
      busLabel: "क्या बस की सुविधा चाहिए?",
      busFeeLabel: "मासिक बस शुल्क",
      admDate: "प्रवेश तिथि"
    }
  };

  const t = translations[lang];
  const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
  const classList = ["Nursery", "LKG", "UKG", ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)];
  const categories = ["General", "OBC", "SC", "ST"];

  const [form, setForm] = useState({
    name: "", className: "", rollNumber: "", regNo: "", phone: "", address: "", 
    fatherName: "", motherName: "", admissionFees: "", totalFees: "",
    aadhaar: "", gender: "", category: "", dob: "", session: "", photo: null, photoURL: "",
    isTransferStudent: false, pnrNumber: "", parentId: "",
    isBusStudent: false, busFees: "0",
    admissionDate: new Date().toISOString().split('T')[0] // 🔥 Default Today's Date
  });

  const [subjects, setSubjects] = useState([]);
  const [newSubText, setNewSubText] = useState(""); 
  const [fatherOpen, setFatherOpen] = useState(false);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fess, setFess] = useState(false);
  const [paidAmount, setPaidAmount] = useState(""); 
  const [paidBusAmount, setPaidBusAmount] = useState(""); 
  const [fatherSearch, setFatherSearch] = useState("");
  const [savedStudentId, setSavedStudentId] = useState(null);

  useEffect(() => {
    if (editData) {
      setForm({ 
        ...editData, 
        photo: null, 
        isBusStudent: editData.isBusStudent || false, 
        busFees: editData.busFees || "0",
        isTransferStudent: editData.isTransferStudent || false,
        pnrNumber: editData.pnrNumber || "",
        admissionDate: editData.admissionDate || new Date().toISOString().split('T')[0]
      });
      setSubjects(editData.subjects || []);
      setSavedStudentId(editData.id);
    } else {
      const now = new Date();
      const currentSession = now.getMonth() + 1 >= 4 ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}` : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`;
      const initData = async () => {
          const nextReg = await generateRegNo();
          setForm(prev => ({ ...prev, session: currentSession, regNo: nextReg }));
      };
      initData();
    }
    const fetchParents = async () => {
      const snap = await getDocs(collection(db, "parents"));
      setParents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchParents();
  }, [editData]);

  const addManualSubject = () => {
    if (newSubText.trim() !== "") {
      setSubjects([...subjects, newSubText.trim()]);
      setNewSubText("");
    }
  };

  const removeSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSelectParent = (p) => {
    setForm(prev => ({
      ...prev, fatherName: p.fatherName, motherName: p.motherName || "",
      phone: p.phone, parentId: p.id, address: p.address || prev.address
    }));
    setFatherOpen(false);
  };

  const generateRegNo = async () => {
    const q = query(collection(db, "students"), orderBy("regNo", "desc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return "1001";
    const lastReg = snap.docs[0].data().regNo;
    return (parseInt(lastReg) + 1).toString();
  };

  const generateRoll = async (cls, sess) => {
    const q = query(collection(db, "students"), where("className", "==", cls), where("session", "==", sess));
    const snap = await getDocs(q);
    let max = 0;
    snap.forEach(d => { 
        const r = parseInt(d.data().rollNumber);
        if (r > max) max = r; 
    });
    return (max + 1).toString();
  };

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    if (name === "className") {
      const roll = editData ? form.rollNumber : await generateRoll(value, form.session);
      setForm(prev => ({ ...prev, className: value, rollNumber: roll }));

      const selectedClass = value.replace("Class ", "");
      if (selectedClass === "9" || selectedClass === "10") {
        setSubjects(["Hindi", "English", "Math", "Science", "Social Science", "Drawing"]);
      } else if (selectedClass === "11" || selectedClass === "12") {
        setSubjects(["Hindi", "English", "Physics", "Chemistry", "Math/Bio"]);
      } else {
        setSubjects([]);
      }
    } else {
      setForm(prev => ({ ...prev, [name]: val }));
    }
  };

  const getOrCreateParent = async () => {
    if (form.parentId) return form.parentId;
    const parentDoc = await addDoc(collection(db, "parents"), { 
        fatherName: form.fatherName, phone: form.phone, motherName: form.motherName,
        address: form.address, students: [], createdAt: serverTimestamp() 
    });
    return parentDoc.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let downloadURL = form.photoURL;
      if (form.photo) {
        const refImg = ref(storage, `students/${Date.now()}_${form.photo.name}`);
        await uploadBytes(refImg, form.photo);
        downloadURL = await getDownloadURL(refImg);
      }
      const pId = await getOrCreateParent();
      const { photo, id, ...safeForm } = form;

      // 🔥 Fees calculation logic with Session
      const schoolMonthly = Number(form.totalFees || 0);
      const busMonthly = form.isBusStudent ? Number(form.busFees || 0) : 0;
      
      let remainingSchoolPaid = Number(paidAmount || 0);
      let remainingBusPaid = Number(paidBusAmount || 0);

      const feeDataForSession = months.reduce((acc, m) => {
        let curPaidSch = 0;
        if (remainingSchoolPaid >= schoolMonthly && schoolMonthly > 0) {
            curPaidSch = schoolMonthly;
            remainingSchoolPaid -= schoolMonthly;
        } else {
            curPaidSch = remainingSchoolPaid;
            remainingSchoolPaid = 0;
        }

        let curPaidBus = 0;
        if (remainingBusPaid >= busMonthly && busMonthly > 0) {
            curPaidBus = busMonthly;
            remainingBusPaid -= busMonthly;
        } else {
            curPaidBus = remainingBusPaid;
            remainingBusPaid = 0;
        }

        acc[m] = { 
            total: schoolMonthly + busMonthly, 
            schoolPart: schoolMonthly, 
            busPart: busMonthly, 
            paidSchool: curPaidSch, 
            paidBus: curPaidBus,
            paidAt: (curPaidSch > 0 || curPaidBus > 0) ? serverTimestamp() : null
        };
        return acc;
      }, {});

      if (editData) {
        await updateDoc(doc(db, "students", editData.id), { ...safeForm, photoURL: downloadURL, parentId: pId, subjects: subjects });
        close();
      } else {
        // 🔥 Save with fees organized by Session
        const studentDocRef = await addDoc(collection(db, "students"), { 
            ...safeForm, photoURL: downloadURL, parentId: pId, subjects: subjects,
            attendance: months.reduce((acc, m) => ({ ...acc, [m]: { present: 0, absent: 0 } }), {}), 
            fees: { [form.session]: feeDataForSession }, // 🔥 Nested under Session
            createdAt: serverTimestamp(), 
            deletedAt: null 
        });

        await updateDoc(doc(db, "parents", pId), { students: arrayUnion(studentDocRef.id) });
        
        await updateTotalStudents();
        setSavedStudentId(studentDocRef.id);
        setTimeout(() => { setFess(true); setLoading(false); }, 800);
      }
    } catch (err) { 
      console.error(err);
      alert("Error saving data!"); 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 p-4">
      {!fess ? (
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-blue-50">
            <h2 className="text-lg font-bold text-blue-700 uppercase tracking-tighter">
                {editData ? t.editTitle : `${t.title} - REG: ${form.regNo}`}
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex border rounded-lg overflow-hidden text-xs font-bold">
                <button type="button" onClick={() => setLang("en")} className={`px-3 py-1.5 ${lang === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>ENG</button>
                <button type="button" onClick={() => setLang("hi")} className={`px-3 py-1.5 ${lang === 'hi' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>HIN</button>
              </div>
              <button type="button" onClick={close} className="text-3xl hover:text-red-500 leading-none">&times;</button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
            <section className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2 font-bold text-gray-500 border-l-4 border-blue-500 pl-2 uppercase text-[10px] tracking-widest">{t.studentInfo}</div>
              
              {/* 🔥 Admission Date Field */}
              <div className="flex flex-col">
                <p className="text-[9px] font-bold text-blue-600 mb-1 uppercase pl-1">{t.admDate}</p>
                <input type="date" name="admissionDate" value={form.admissionDate} onChange={handleChange} className="border p-2.5 rounded-lg outline-blue-500" required />
              </div>

              <input name="name" value={form.name} onChange={handleChange} placeholder={t.name} className="border p-2.5 rounded-lg outline-blue-500 shadow-sm mt-auto" required />
              
              <div className="grid grid-cols-2 gap-2">
                <input name="regNo" value={form.regNo} readOnly className="border p-2.5 rounded-lg bg-blue-50 font-bold" />
                <input name="rollNumber" value={form.rollNumber} readOnly className="border p-2.5 rounded-lg bg-gray-100 italic" />
              </div>

              <select name="className" value={form.className} onChange={handleChange} className="border p-2.5 rounded-lg outline-blue-500" required>
                <option value="">Select Class</option>
                {classList.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
              </select>

              <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg border">
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Subject Management:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {subjects.map((sub, index) => (
                    <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[11px] font-bold uppercase flex items-center gap-1">
                      {sub} <button type="button" onClick={() => removeSubject(index)} className="text-red-500 font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newSubText} onChange={(e) => setNewSubText(e.target.value)} placeholder="Add Subject..." className="flex-1 border p-2 rounded text-sm bg-white" />
                  <button type="button" onClick={addManualSubject} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold uppercase">Add</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select name="gender" value={form.gender} onChange={handleChange} className="border p-2.5 rounded-lg outline-blue-500" required>
                  <option value="">{t.gender}</option><option>Male</option><option>Female</option>
                </select>
                <select name="category" value={form.category} onChange={handleChange} className="border p-2.5 rounded-lg outline-blue-500" required>
                  <option value="">{t.category}</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <input type="date" name="dob" value={form.dob} onChange={handleChange} className="border p-2.5 rounded-lg outline-blue-500" required />
              <input name="aadhaar" value={form.aadhaar} onChange={handleChange} placeholder={t.aadhaar} className="border p-2.5 rounded-lg outline-blue-500" required />

              <div className="md:col-span-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <label className="flex items-center gap-2 text-sm font-bold text-blue-800 cursor-pointer">
                  <input type="checkbox" name="isTransferStudent" checked={form.isTransferStudent} onChange={handleChange} className="w-4 h-4 accent-blue-600" />
                  {t.isTransfer}
                </label>
                {form.isTransferStudent && (
                  <div className="mt-3">
                    <p className="text-[9px] font-bold text-blue-600 mb-1 tracking-widest uppercase">{t.pnrLabel}</p>
                    <input name="pnrNumber" value={form.pnrNumber} onChange={handleChange} placeholder="Enter UDISE+ PEN Number" className="w-full border p-2.5 rounded-lg bg-white font-bold outline-blue-500 shadow-sm" required={form.isTransferStudent} />
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="font-bold text-gray-500 border-l-4 border-green-500 pl-2 uppercase text-[10px] tracking-widest">{t.parentInfo}</div>
              <div className="relative">
                <div onClick={() => setFatherOpen(!fatherOpen)} className="border-2 border-green-50 p-3 rounded-xl cursor-pointer bg-white flex justify-between items-center text-sm text-blue-600 font-bold">
                  <span>{form.parentId ? `Linked: ${form.fatherName}` : "🔍 Search Existing Parent Database"}</span>
                  <span>▼</span>
                </div>
                {fatherOpen && (
                  <div className="absolute z-10 bg-white border w-full mt-1 rounded-xl shadow-2xl max-h-48 overflow-auto">
                    <input type="text" autoFocus onChange={(e) => setFatherSearch(e.target.value)} placeholder="Type name..." className="p-3 w-full border-b sticky top-0 bg-white outline-none" />
                    <div onClick={() => { setForm(prev => ({ ...prev, fatherName: "", phone: "", motherName: "", parentId: "" })); setFatherOpen(false); }} className="p-4 text-blue-600 font-black text-xs cursor-pointer hover:bg-blue-50 uppercase tracking-widest">+ Add New Parent</div>
                    {parents.filter(p => p.fatherName?.toLowerCase().includes(fatherSearch.toLowerCase())).map(p => (
                      <div key={p.id} onClick={() => handleSelectParent(p)} className="p-3 hover:bg-green-50 cursor-pointer border-b text-sm flex justify-between">
                        <span className="font-bold">{p.fatherName}</span>
                        <span className="text-gray-400 font-medium">{p.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="Father's Name" className="border p-2.5 rounded-lg outline-blue-500 shadow-sm" required />
                <input name="motherName" value={form.motherName} onChange={handleChange} placeholder="Mother's Name" className="border p-2.5 rounded-lg outline-blue-500 shadow-sm" required />
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Mobile" className="border p-2.5 rounded-lg outline-blue-500 font-bold shadow-sm" required maxLength="10" />
              </div>
            </section>

            <section className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2 font-bold text-gray-500 border-l-4 border-yellow-500 pl-2 uppercase text-[10px] tracking-widest">{t.feesInfo}</div>
              <input name="admissionFees" value={form.admissionFees} onChange={handleChange} placeholder="Admission Fee" className="border p-2.5 rounded-lg shadow-sm" required />
              <input name="totalFees" value={form.totalFees} onChange={handleChange} placeholder="Monthly Fee" className="border p-2.5 rounded-lg font-bold shadow-sm" required />
              
              <div className="md:col-span-2 bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                <label className="flex items-center gap-2 text-sm font-bold text-yellow-800 cursor-pointer">
                  <input type="checkbox" name="isBusStudent" checked={form.isBusStudent} onChange={handleChange} className="w-4 h-4 accent-yellow-600" />
                  {t.busLabel}
                </label>
                {form.isBusStudent && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input name="busFees" value={form.busFees} onChange={handleChange} placeholder="Monthly Bus Fee" className="border p-2.5 rounded-lg bg-white font-bold" required />
                    {!editData && <input value={paidBusAmount} onChange={(e) => setPaidBusAmount(e.target.value)} placeholder="Bus Paid Now (₹)" className="border p-2.5 rounded-lg bg-green-50 font-bold outline-green-500 shadow-inner" />}
                  </div>
                )}
              </div>
              {!editData && (
                <div className="md:col-span-2">
                  <p className="text-[9px] font-bold text-blue-600 mb-1 tracking-widest uppercase">School Fees Paid Now (₹)</p>
                  <input value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Ex: 1500" className="w-full border p-2.5 rounded-lg bg-blue-50 font-black text-blue-700 outline-blue-500 shadow-inner" />
                </div>
              )}
              <textarea name="address" value={form.address} onChange={handleChange} placeholder="Address" className="md:col-span-2 border p-2.5 rounded-lg h-20 outline-blue-500 shadow-sm" required />
              <div className="md:col-span-2 border-2 border-dashed p-4 text-center rounded-xl bg-gray-50 border-gray-300">
                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">Student Photo Upload</p>
                <input type="file" onChange={(e) => setForm(p => ({ ...p, photo: e.target.files[0] }))} className="text-xs text-gray-500" />
              </div>
            </section>
            
            <button disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl uppercase transition-all hover:bg-blue-700 active:scale-95 disabled:bg-gray-400 flex items-center justify-center">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Saving Student...
                </>
              ) : (editData ? t.updateBtn : t.saveBtn)}
            </button>
          </form>
        </div>
      ) : (
        <AdmissionDetails studentId={savedStudentId} paidAmount={paidAmount} paidBusAmount={paidBusAmount} subjects={subjects} onClose={() => { setFess(false); close(); }} />
      )}
    </div>
  );
}