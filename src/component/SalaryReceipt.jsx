import React from "react";

export default function SalaryReceipt({
  teacherName,
  subject,
  phone,
  month,
  totalAmount,
  paidAmount,
  paidAt,
  receiptNo,
  onClose,
}) {
  const date =
    paidAt?.seconds
      ? new Date(paidAt.seconds * 1000).toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB");

  return (
    <>
      <style>
        {`
        /* -------- SCREEN -------- */
        .screen-wrapper {
          max-width: 900px;
          margin: auto;
          padding-top: 40px;
          transform: scale(0.9);
          transform-origin: top center;
        }

        /* -------- PRINT -------- */
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }

          body * {
            visibility: hidden;
          }

          #print-area, #print-area * {
            visibility: visible;
          }

          #print-area {
            margin: 0 auto;
            padding: 0;
          }
        }
        `}
      </style>

      {/* OVERLAY */}
      <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
        <div className="screen-wrapper">

          {/* RECEIPT PAGE */}
          <div
            id="print-area"
            className="bg-white mx-auto shadow-lg"
            style={{
              width: "75%",           // 🔥 looks better
              padding: "30px",
              minHeight: "auto",
            }}
          >
            {/* CLOSE */}
            <button
              onClick={onClose}
              className="absolute top-10 right-30 w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-red-200 hover:text-red-700 print:hidden"
            >
              ✖
            </button>

            {/* HEADER */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold tracking-wide">
                SALARY RECEIPT
              </h1>
              <p className="font-semibold mt-1">
                Bright Future School 
              </p>
              <p className="text-sm text-gray-600">
                Siddharth Nagar, Uttar Pradesh
              </p>
            </div>

            {/* META */}
            <div className="flex justify-between text-sm mb-6">
              <div>
                <p><b>Receipt No:</b> {receiptNo}</p>
                <p><b>Salary Month:</b> {month}</p>
              </div>
              <div>
                <p><b>Date:</b> {date}</p>
              </div>
            </div>

            {/* TEACHER BOX */}
            <div className="border rounded-md p-4 mb-6 bg-gray-50">
              <p><b>Name:</b> {teacherName}</p>
              <p><b>Subject:</b> {subject}</p>
              <p><b>Phone:</b> {phone}</p>
            </div>

            {/* SALARY TABLE */}
            <table className="w-full border text-sm mb-8">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Description</th>
                  <th className="border p-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">Monthly Salary</td>
                  <td className="border p-2 text-right">{totalAmount}</td>
                </tr>
                <tr className="font-bold">
                  <td className="border p-2">Paid Amount</td>
                  <td className="border p-2 text-right">{paidAmount}</td>
                </tr>
              </tbody>
            </table>

            {/* SIGNATURE */}
            <div className="flex justify-between mt-12 text-sm">
              <div className="text-center">
                <div className="border-t w-52 pt-2">
                  Teacher Signature
                </div>
              </div>
              <div className="text-center">
                <div className="border-t w-52 pt-2">
                  Authorized Signature
                </div>
              </div>
            </div>

            {/* PRINT BUTTON */}
            <div className="text-center mt-10 print:hidden">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-10 py-2 rounded font-semibold"
              >
                🖨 Print Receipt
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
