import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function FeesReceipt({
  studentId,
  name,
  studentClass,
  monthlyFee = 0,
  busFee = 0,
  payMonth = "",
  paidAt,
  onClose,
}) {
  const [school, setSchool] = useState({
    name: "BRIGHT PUBLIC HIGH SCHOOL",
    address: "Siddharth Nagar, Uttar Pradesh",
    logoUrl: "",
    phone: "91XXXXXXXX"
  });

  const [studentDetails, setStudentDetails] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const schoolSnap = await getDoc(doc(db, "settings", "schoolDetails"));
        if (schoolSnap.exists()) setSchool(schoolSnap.data());

        if (studentId) {
          const stuSnap = await getDoc(doc(db, "students", studentId));
          if (stuSnap.exists()) setStudentDetails(stuSnap.data());
        }
      } catch (err) {
        console.error("Error fetching details:", err);
      }
    };
    fetchData();
  }, [studentId]);

  const date = paidAt?.seconds
    ? new Date(paidAt.seconds * 1000).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  const totalAmount = Number(monthlyFee || 0) + Number(busFee || 0);

  const ReceiptContent = ({ copyName }) => (
    <div className="bg-white border-2 border-black p-4 mb-2 relative receipt-block" 
         style={{ height: "120mm", width: "100%", boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
      
      <div className="absolute top-2 right-2 bg-black text-white px-2 py-0.5 text-[8px] font-bold uppercase">
        {copyName}
      </div>

      {/* HEADER */}
      <div className="flex items-center border-b border-black pb-2 mb-2 gap-3">
        {school.logoUrl && <img src={school.logoUrl} alt="Logo" className="h-12 w-12 object-contain" />}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-black uppercase leading-tight text-blue-900">{school.name}</h1>
          <p className="text-[8px] font-bold text-gray-700">{school.address}</p>
          <p className="text-[9px] font-black italic text-blue-700">Mob: {school.phone}</p>
        </div>
      </div>

      <div className="text-center mb-2">
        <span className="border border-black px-4 py-0.5 font-black text-[10px] uppercase bg-gray-50 italic">Fees Receipt</span>
      </div>

      {/* STUDENT INFO */}
      <div className="grid grid-cols-2 text-[9px] gap-y-0.5 mb-2 border-b border-dashed border-black pb-1">
        <p><b>Reg No:</b> {studentDetails?.regNo || "---"}</p>
        <p className="text-right"><b>Date:</b> {date}</p>
        <p className="col-span-2 text-[11px]"><b>Student:</b> <span className="font-black uppercase">{name}</span></p>
        <p><b>Father:</b> <span className="uppercase">{studentDetails?.fatherName}</span></p>
        <p className="text-right"><b>Class:</b> {studentClass}</p>
        <p><b>Aadhaar:</b> {studentDetails?.aadhaar || "---"}</p>
        <p className="text-right"><b>Month:</b> <span className="font-bold text-blue-700 uppercase">{payMonth}</span></p>
      </div>

      {/* FEES TABLE */}
      <table className="w-full border-collapse border border-black text-[10px] mb-2">
        <thead>
          <tr className="bg-gray-100 uppercase">
            <th className="border border-black p-1 text-left">Description</th>
            <th className="border border-black p-1 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-2 py-1 font-bold uppercase">Tuition Fees</td>
            <td className="border border-black px-2 py-1 text-right font-black">₹{Number(monthlyFee).toFixed(2)}</td>
          </tr>
          <tr>
             <td className="border border-black px-2 py-1 font-bold uppercase italic text-gray-600">Transport Charges</td>
             <td className="border border-black px-2 py-1 text-right font-black text-gray-600">₹{Number(busFee).toFixed(2)}</td>
          </tr>
          <tr className="bg-blue-50 font-black text-[11px]">
            <td className="border border-black px-2 py-1 text-right uppercase">Total Paid:</td>
            <td className="border border-black px-2 py-1 text-right text-blue-900">₹{totalAmount.toFixed(2)}/-</td>
          </tr>
        </tbody>
      </table>

      <p className="text-[8px] font-bold uppercase italic text-gray-500 mb-6">Amt in words: {toWords(Math.floor(totalAmount))} Only</p>

      <div className="flex justify-between absolute bottom-4 left-4 right-4 text-[8px] font-black uppercase">
        <div className="border-t border-black w-24 text-center pt-1">Parent's Sign</div>
        <div className="border-t border-black w-24 text-center pt-1 italic text-blue-900">Authorized Sign</div>
      </div>
    </div>
  );

  return (
    <>
      <style>
        {`
        .receipt-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8);
          display: flex; justify-content: center; align-items: flex-start;
          padding: 10px; z-index: 10000; overflow-y: auto;
        }
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0mm !important; 
          }
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden;
          }
          .receipt-overlay { 
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: white !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print { 
            display: none !important; 
          }
          .print-container { 
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important; 
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          #print-area {
            padding: 2mm !important;
            width: 210mm;
            margin: auto;
          }
          .receipt-block { 
            page-break-inside: avoid !important;
            border: 2px solid black !important;
            margin-bottom: 5mm !important;
          }
        }
        `}
      </style>

      <div className="receipt-overlay">
        <div className="print-container bg-white p-4 rounded-xl shadow-2xl" style={{ width: "210mm" }}>
          
          <div className="no-print flex justify-between items-center bg-gray-100 p-3 mb-4 rounded-lg">
             <button onClick={onClose} className="bg-red-600 text-white px-4 py-2 rounded font-bold text-xs uppercase">Close</button>
             <p className="font-bold text-xs text-gray-600">A4 PRINTER SETTING: MARGINS = NONE</p>
             <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded font-black text-xs uppercase">Print Receipt</button>
          </div>

          <div id="print-area">
            <ReceiptContent copyName="Office Copy" />
            <div className="no-print text-center text-gray-300 my-1 text-[8px]">--------------------------------------------------</div>
            <ReceiptContent copyName="Student Copy" />
          </div>
        </div>
      </div>
    </>
  );
}

function toWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num === 0) return 'Zero';
    function convert(n) {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
        return n;
    }
    return convert(num);
}