import React from "react";
import { Link } from "react-router-dom";
import { useHtmlPage } from "../../utils/htmlPage";
import * as LucideIcons from "lucide-react";

export default function DigitalCheckinIndex() {
  useHtmlPage({
    title: "RoomHy Digital Check-In",
    bodyClass: "",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    ],
    links: [
      { rel: "stylesheet", href: "/digital-checkin/assets/css/index.css" },
    ],
  });

  return (
    <div className="html-page">
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <LucideIcons.Home className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">RoomHy Digital Check-In</h1>
            <p className="text-gray-500">Select your role to continue</p>
          </div>
          
          <div className="space-y-4">
            <Link 
              to="/digital-checkin/ownerprofile"
              className="block w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LucideIcons.User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Owner Check-In</h3>
                  <p className="text-sm text-gray-500">Complete your property verification</p>
                </div>
                <LucideIcons.ChevronRight className="w-5 h-5 text-purple-400 ml-auto" />
              </div>
            </Link>
            
            <Link 
              to="/digital-checkin/tenantprofile"
              className="block w-full p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LucideIcons.Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Tenant Check-In</h3>
                  <p className="text-sm text-gray-500">Complete your tenant verification</p>
                </div>
                <LucideIcons.ChevronRight className="w-5 h-5 text-indigo-400 ml-auto" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

