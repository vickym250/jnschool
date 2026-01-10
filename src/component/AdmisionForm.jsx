import React, { useRef, useState, useEffect } from "react";
import { db } from "../firebase"; 
import { doc, getDoc } from "firebase/firestore";

export default function AdmissionDetails({ studentId, paidAmount, paidBusAmount, onClose }) {
    const printRef = useRef();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [finalPhoto, setFinalPhoto] = useState(null);
    
    const [school, setSchool] = useState({
        name: "Your School Name",
        address: "School Address",
        affiliation: "Affiliation Info",
        logoUrl: "download.jpg",
        phone: "91XXXXXXXX"
    });

    const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];

    useEffect(() => {
        const fetchData = async () => {
            if (!studentId) return;
            try {
                const schoolSnap = await getDoc(doc(db, "settings", "schoolDetails"));
                if (schoolSnap.exists()) setSchool(schoolSnap.data());

                const docSnap = await getDoc(doc(db, "students", studentId));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setStudent(data);
                    
                    if (data.photoURL) {
                        const img = new Image();
                        const proxyUrl = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(data.photoURL)}`;
                        img.crossOrigin = "anonymous";
                        img.src = proxyUrl;
                        img.onload = () => { setFinalPhoto(proxyUrl); setLoading(false); };
                        img.onerror = () => { setFinalPhoto(data.photoURL); setLoading(false); };
                    } else { setLoading(false); }
                } else { setLoading(false); }
            } catch (err) { 
                console.error(err); 
                setLoading(false); 
            }
        };
        fetchData();
    }, [studentId]);

    // 🔥 Sahi Logic: Kitne mahine paid hain wo batane ke liye
    const getPaidMonthsLabel = (amount, monthlyFee) => {
        const amt = Number(amount || 0);
        const fee = Number(monthlyFee || 0);
        if (amt <= 0 || fee <= 0) return "";
        const count = Math.floor(amt / fee);
        if (count === 0) return "(Partial)";
        const paidList = months.slice(0, count);
        return `(Paid: ${paidList[0]} to ${paidList[paidList.length - 1]})`;
    };

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        let iframe = document.getElementById('print-iframe');
        if (iframe) document.body.removeChild(iframe);

        iframe = document.createElement('iframe');
        iframe.id = 'print-iframe';
        iframe.style.position = 'fixed'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>Admission Slip</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        @page { size: A4 portrait; margin: 0; }
                        body { margin: 0; padding: 10mm; background: #fff; -webkit-print-color-adjust: exact !important; font-family: sans-serif; }
                        .sheet-container { border: 2px solid #000; padding: 20px; margin-bottom: 25px; position: relative; box-sizing: border-box; }
                        .page-break-divider { page-break-after: always; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 11px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    ${content}
                    <script>
                        window.onload = function() {
                            setTimeout(() => {
                                window.focus(); window.print();
                                setTimeout(() => { window.frameElement.remove(); }, 1500);
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        doc.close();
    };

    if (loading) return <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center font-bold text-blue-600 animate-pulse uppercase tracking-widest">Generating Official Receipt...</div>;
    if (!student) return null;

    // Fees Calculations
    const totalCurrentPaid = (Number(student.admissionFees) || 0) + (Number(paidAmount) || 0) + (Number(paidBusAmount) || 0);

    const DocumentSheet = ({ copyName, isLast }) => (
        <div className={`sheet-container ${!isLast ? 'page-break-divider' : ''}`}>
            <div className="absolute top-2 right-2 bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-tighter">{copyName}</div>
            
            {/* Header */}
            <div className="flex items-center border-b-2 border-black pb-3 gap-4">
                <img src={school.logoUrl || "download.jpg"} className="w-20 h-20 object-contain" />
                <div className="flex-1 text-center pr-12">
                    <h1 className="text-3xl font-black text-blue-900 uppercase leading-none">{school.name}</h1>
                    <p className="text-[11px] font-bold text-gray-700 mt-1 uppercase tracking-tight">{school.affiliation}</p>
                    <p className="text-[10px] font-medium text-gray-600 italic">{school.address}</p>
                    <p className="text-[12px] font-black text-blue-800 mt-1">Mob: {school.phone}</p>
                </div>
            </div>

            <div className="bg-black text-white text-center text-[11px] font-bold py-1 uppercase tracking-[3px] my-2">Admission Cum Fee Receipt</div>

            {/* Photo & Basic Details */}
            <div className="flex gap-4 my-3">
                <div className="w-28 h-32 border-2 border-black overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
                    {finalPhoto ? <img src={finalPhoto} className="w-full h-full object-cover" /> : <div className="text-[10px] font-bold text-gray-400">STUDENT PHOTO</div>}
                </div>
                <div className="flex-1 grid grid-cols-2 border-t border-l border-black text-[11px]">
                    <div className="p-1.5 border-r border-b bg-gray-100 font-bold uppercase">Registration No.</div>
                    <div className="p-1.5 border-r border-b font-black text-blue-800 text-[13px]">{student.regNo}</div>
                    <div className="p-1.5 border-r border-b bg-gray-100 font-bold uppercase">Class / Section</div>
                    <div className="p-1.5 border-r border-b font-black uppercase">{student.className}</div>
                    <div className="p-1.5 border-r border-b bg-gray-100 font-bold uppercase">Session</div>
                    <div className="p-1.5 border-r border-b font-black">{student.session}</div>
                    <div className="p-1.5 border-r border-b bg-gray-100 font-bold uppercase">Date</div>
                    <div className="p-1.5 border-r border-b font-black">{new Date().toLocaleDateString('en-GB')}</div>
                </div>
            </div>

            {/* Main Info Table */}
            <div className="border-t border-l border-black mb-4 text-[12px]">
                <div className="grid grid-cols-4">
                    <div className="p-2 border-r border-b bg-gray-50 font-bold uppercase text-[10px]">Student Name</div>
                    <div className="p-2 border-r border-b font-black uppercase text-blue-900 col-span-3 text-[14px]">{student.name}</div>
                    
                    <div className="p-2 border-r border-b bg-gray-50 font-bold uppercase text-[10px]">Father's Name</div>
                    <div className="p-2 border-r border-b font-bold uppercase col-span-3">{student.fatherName}</div>

                    <div className="p-2 border-r border-b bg-gray-50 font-bold uppercase text-[10px]">Gender / Roll</div>
                    <div className="p-2 border-r border-b font-bold uppercase">{student.gender} / {student.rollNumber || "NA"}</div>
                    <div className="p-2 border-r border-b bg-gray-50 font-bold uppercase text-[10px]">Date of Birth</div>
                    <div className="p-2 border-r border-b font-bold uppercase">{student.dob}</div>

                    <div className="p-2 border-r border-b bg-gray-50 font-bold uppercase text-[10px]">Mother's Name</div>
                    <div className="p-2 border-r border-b font-bold col-span-3 uppercase">{student.motherName}</div>

                    <div className="p-2 border-r border-b bg-gray-50 font-bold uppercase text-[10px]">Aadhaar No.</div>
                    <div className="p-2 border-r border-b font-bold col-span-3">{student.aadhaar}</div>

                    <div className="p-2 border-r border-b bg-gray-50 font-bold uppercase text-[10px]">Contact No</div>
                    <div className="p-2 border-r border-b font-bold col-span-3">{student.phone}</div>

                    <div className="p-2 border-r border-b bg-gray-50 font-bold uppercase text-[10px]">Address</div>
                    <div className="p-2 border-r border-b font-medium italic col-span-3 text-[11px] uppercase">{student.address}</div>
                </div>
            </div>

            {/* Subjects Chips */}
            <div className="mb-4">
                <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Opted Subjects:</p>
                <div className="flex flex-wrap gap-2">
                    {student.subjects?.map((sub, i) => (
                        <span key={i} className="px-2 py-0.5 border border-black rounded font-bold text-[10px] bg-white uppercase">{sub}</span>
                    ))}
                </div>
            </div>

            {/* Final Fees Calculation Table */}
            <table className="w-full border-2 border-black text-[12px] mb-4">
                <thead className="bg-gray-200 uppercase font-black">
                    <tr>
                        <th className="border border-black p-2 text-left">Fee Particulars</th>
                        <th className="border border-black p-2 text-right">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody className="font-bold">
                    <tr>
                        <td className="border border-black p-2 uppercase font-medium">Admission & Registration Charges</td>
                        <td className="border border-black p-2 text-right">₹{Number(student.admissionFees || 0).toFixed(2)}</td>
                    </tr>
                    {paidAmount > 0 && (
                        <tr className="text-blue-900 bg-blue-50/30">
                            <td className="border border-black p-2 uppercase">
                                School Tuition Fee <span className="text-[9px] text-gray-500 font-normal italic ml-2">{getPaidMonthsLabel(paidAmount, student.totalFees)}</span>
                            </td>
                            <td className="border border-black p-2 text-right font-black">₹{Number(paidAmount).toFixed(2)}</td>
                        </tr>
                    )}
                    {(student.isBusStudent && paidBusAmount > 0) && (
                        <tr className="text-green-900 bg-green-50/30">
                            <td className="border border-black p-2 uppercase">
                                Transport / Bus Fee <span className="text-[9px] text-gray-500 font-normal italic ml-2">{getPaidMonthsLabel(paidBusAmount, student.busFees)}</span>
                            </td>
                            <td className="border border-black p-2 text-right font-black">₹{Number(paidBusAmount).toFixed(2)}</td>
                        </tr>
                    )}
                    <tr className="bg-gray-100">
                        <td className="border border-black p-3 text-right uppercase text-[13px] font-black">Grand Total Received:</td>
                        <td className="border border-black p-3 text-right text-blue-900 text-[16px] font-black italic shadow-inner">₹{totalCurrentPaid.toFixed(2)}/-</td>
                    </tr>
                </tbody>
            </table>
            
            <p className="text-[10px] font-black uppercase italic mb-10 text-gray-600">
                Amount in Words: {toWords(Math.floor(totalCurrentPaid))} Rupees Only
            </p>

            {/* Signatures */}
            <div className="flex justify-between px-10 mt-12 pb-4">
                <div className="text-center w-40 border-t-2 border-black pt-1 font-black text-[10px] uppercase tracking-tighter">Student/Parent Signature</div>
                <div className="text-center w-40 border-t-2 border-black pt-1 font-black text-[10px] uppercase tracking-tighter">Authorised Signatory</div>
            </div>

            {/* Bottom Note */}
            <div className="text-[9px] text-center text-gray-400 mt-2 border-t pt-2 border-gray-100 italic font-medium">
                Note: Fees once paid is non-refundable. This is a computer-generated receipt.
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-300 z-[100] overflow-y-auto p-4 flex flex-col items-center">
            {/* Control Bar */}
            <div className="max-w-4xl w-full flex justify-between items-center bg-white p-4 rounded-xl shadow-lg mb-6 no-print sticky top-0 border-b-4 border-blue-600">
                <button onClick={onClose} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-black text-sm hover:bg-black transition-all">CLOSE</button>
                <div className="text-center">
                    <p className="font-black text-blue-800 uppercase text-sm tracking-widest">Receipt Generated Successfully</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Ready for Laser Printing</p>
                </div>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-8 py-2 rounded-lg font-black text-sm uppercase shadow-xl hover:bg-blue-700 transition-all active:scale-95">Print Invoice</button>
            </div>

            {/* Print Area */}
            <div ref={printRef} className="w-full max-w-[210mm] bg-white p-6 shadow-2xl rounded-sm">
                <DocumentSheet copyName="Office Record Copy" isLast={false} />
                <div className="no-print flex items-center justify-center my-6 gap-4">
                    <div className="h-[1px] bg-gray-300 flex-1"></div>
                    <span className="text-gray-400 font-black text-[10px] uppercase tracking-[10px]">✂️ CUTTING LINE ✂️</span>
                    <div className="h-[1px] bg-gray-300 flex-1"></div>
                </div>
                <DocumentSheet copyName="Student/Parent Copy" isLast={true} />
            </div>
        </div>
    );
}

// 🔥 Helper: Number to Words (Hindi Style - Lakhs/Thousands)
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