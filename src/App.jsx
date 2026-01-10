import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./component/Sidebar";
import Header from "./component/Header";
import Dashboard from "./page/Dashboard";
import StudentList from "./page/Student";
import Attendance from "./page/Attendance";
import HomeworkPage from "./page/HomeworkPage";
import NoticePage from "./page/NoticePage";
import TestPage from "./page/TestAdd";
import TeachersManagementPage from "./page/Teachermanage";
import TeacherAttendance from "./page/TeacherAttendance";
import FinalResultPage from "./page/Result";
import FeesReceipt from "./component/Fess";
import IDCardGenerator from "./page/Idcard";
import StudentProfile from "./page/StudentProfile";
import AbsentStudents from "./page/AbsentStudents";
import MarksSheet from "./component/Anual";

import Login from "./page/Login";

import { useSidebar } from "./component/SidebarContext";
import ProtectedRoute from "./component/ProtectedRoute";
import HelpPage from "./page/HelpLine";
import SchoolStatusGuard from "./component/SchoolStatusGuard";
import AllReport from "./component/AllReport";
import ChangePassword from "./component/ChangePassword";
import ExamTimetable from "./page/ExamTimetable";
import SchoolManager from "./page/SchoolManager";
import TransferCertificate from "./component/TransferCertificate";

// ... (baki imports same rahenge)

export default function App() {
  const { isOpen } = useSidebar();

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Page as Default */}
        <Route path="/" element={<Login />} />
        <Route path="/profile/:id" element={<StudentProfile />} />

        <Route
          path="/*"
          element={
            <SchoolStatusGuard>
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-100 relative">
                  
                  {/* SIDEBAR */}
                  <div className={`fixed top-0 left-0 h-screen z-50 bg-white transition-all duration-300 ${isOpen ? "w-64" : "w-0"} md:${isOpen ? "w-64" : "w-20"}`}>
                    <Sidebar />
                  </div>

                  {/* CONTENT */}
                  <div className={`flex flex-col min-h-screen transition-all duration-300 ml-0 md:${isOpen ? "ml-64" : "ml-0"}`}>
                    <Header />

                    <main className="p-4 md:p-6 flex-grow">
                      <Routes>
                        <Route path="/dash" element={<Dashboard />} />
                        <Route path="/student" element={<StudentList />} />
                        <Route path="/attendance" element={<Attendance />} />
                        <Route path="/homework" element={<HomeworkPage />} />
                        <Route path="/notice" element={<NoticePage />} />
                        <Route path="/test" element={<TestPage />} />
                        <Route path="/teacher" element={<TeachersManagementPage />} />
                        <Route path="/teacherattendace" element={<TeacherAttendance />} />
                        <Route path="/result" element={<FinalResultPage />} />
                        <Route path="/fees" element={<FeesReceipt />} />
                        <Route path="/idcard/:studentId?" element={<IDCardGenerator />} />
                        <Route path="/absentstudent" element={<AbsentStudents />} />
                        <Route path="/marksheet/:studentId" element={<MarksSheet />} />
                        <Route path="/help" element={<HelpPage />} />
                        <Route path="/all-report/:className" element={<AllReport />} />
                        <Route path="/tc/:id" element={<TransferCertificate />} />
                        
                        {/* ✅ Change Password Route ko upar rakha hai */}
                        <Route path="/change-password" element={<ChangePassword/>} />
                        <Route path="/exam-time" element={<ExamTimetable/>} />
                        <Route path="/manage" element={<SchoolManager/>} />

                        {/* ✅ Yeh catch-all route dashboard par bhej dega agar URL galat ho */}
                        <Route path="*" element={<Navigate to="/dash" replace />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            </SchoolStatusGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

