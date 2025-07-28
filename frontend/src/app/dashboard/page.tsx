import AIRedactDialog from "@/components/dashboard/ai-redact-dialog";
import RedactionJourney from "@/components/dashboard/redaction-journey";
import Sidebar from "@/components/dashboard/sidebar";
import { BsStars } from "react-icons/bs";
import { IoMdAddCircle } from "react-icons/io";
import dashboardbg from "../../../public/assets/images/dashboard-bg.jpg";

export default function Dashboard() {
  return (
    <main className="h-screen min-h-screen flex relative">
      <Sidebar />
      <section
        className="h-full w-full flex-grow bg-no-repeat bg-cover bg-center animate-dashboardbg pl-4 pt-4 flex flex-col gap-4 overflow-auto"
        style={{
          backgroundImage: `url(${dashboardbg.src})`,
        }}
      >
        <div className="flex-grow-[0.3]"></div>
        <div className="flex flex-col md:flex-row gap-4 mr-4">
          {/* <div className="bg-[linear-gradient(91.77deg,_#A319DA_1.07%,_#8A2DFC_99.2%)] text-white p-4 rounded-lg flex items-center justify-between gap-4 max-w-sm w-full cursor-pointer">
            <div className="flex flex-col gap-1">
              <p className="font-[500]">Create a new Project</p>
              <p className="text-xs">Start Redaction from Scratch</p>
            </div>
            <IoMdAddCircle size={30} />
          </div> */}
          <AIRedactDialog
            trigger={
              <div className="bg-[linear-gradient(91.77deg,_#7512F0_1.07%,_#3C58F4_99.2%)] text-white p-4 rounded-lg flex items-center justify-between gap-4 max-w-sm w-full cursor-pointer">
                <div className="flex flex-col gap-1">
                  <p className="font-[500]">Smart AI Redaction</p>
                  <p className="text-xs">Smart Detection and Redaction</p>
                </div>
                <BsStars size={35} />
              </div>
            }
          />
        </div>
        <RedactionJourney />
      </section>
    </main>
  );
}
