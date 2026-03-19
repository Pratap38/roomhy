import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";

export default function SuperadminBackup() {
  useHtmlPage({
    title: "Roomhy - Backup Settings",
    bodyClass: "text-slate-800",
    htmlAttrs: {
  "lang": "en"
},
    metas: [
  {
    "charset": "UTF-8"
  },
  {
    "name": "viewport",
    "content": "width=device-width, initial-scale=1.0"
  }
],
    bases: [],
    links: [
  {
    "rel": "preconnect",
    "href": "https://fonts.googleapis.com"
  },
  {
    "rel": "preconnect",
    "href": "https://fonts.gstatic",
    "crossorigin": true
  },
  {
    "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    "rel": "stylesheet"
  },
  {
    "rel": "stylesheet",
    "href": "/superadmin/assets/css/backup.css"
  }
],
    styles: [],
    scripts: [
  {
    "src": "https://cdn.tailwindcss.com"
  },
  {
    "src": "https://unpkg.com/lucide@latest"
  },
  {
    "src": "/superadmin/assets/js/backup.js"
  },
  {
    "src": "./mobile-sidebar.js"
  }
],
    inlineScripts: []
  });

  return (
    <div className="html-page">
      
          <div className="flex h-screen overflow-hidden">
                     
              <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
                  <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
                       <div className="flex items-center gap-3">
                           
                           <div><img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" /><span className="text-[10px] text-gray-500">SUPER ADMIN</span></div>
                       </div>
                  </div>
                  <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
              </aside>
      
              
              <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
                  
                  <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
                      <div className="flex items-center">
                          <button id="mobile-menu-open" className="md:hidden mr-4 text-slate-500"><i data-lucide="menu" className="w-6 h-6"></i></button>
                          <div className="flex items-center text-sm">
                              <span className="text-slate-500 font-medium">System Settings</span>
                              <i data-lucide="chevron-right" className="w-4 h-4 mx-2 text-slate-400"></i>
                              <span className="text-slate-800 font-semibold">Backups</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <button className="text-slate-400 hover:text-slate-600"><i data-lucide="bell" className="w-5 h-5"></i></button>
                          <div className="relative group">
                              <button className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                                  <img src="https://i.pravatar.cc/150?u=superadmin" alt="Admin" className="w-8 h-8 rounded-full border border-slate-200" />
                              </button>
                          </div>
                      </div>
                  </header>
      
                  
                  <main className="flex-1 overflow-y-auto p-6 md:p-8">
                      <div className="max-w-7xl mx-auto">
                          
                          
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                              <div>
                                  <h1 className="text-2xl font-bold text-slate-800">Data Backup & Recovery</h1>
                                  <p className="text-sm text-slate-500 mt-1">Manage automated backups and manual data snapshots.</p>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                  <button onClick={function(event) { try { return Function('event', "toggleModal('manualBackupModal')").call(event.currentTarget, event); } catch (err) { console.error(err); } }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center shadow-sm transition-all">
                                      <i data-lucide="database" className="w-4 h-4 mr-2"></i> Create Backup Now
                                  </button>
                              </div>
                          </div>
      
                          
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                              
                              
                              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                                      <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                          <i data-lucide="clock" className="w-5 h-5 text-blue-600 mr-2"></i> Automated Schedule
                                      </h3>
                                      <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                          <input type="checkbox" checked name="toggle" id="autoBackupToggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300" />
                                          <label htmlFor="autoBackupToggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-green-500 cursor-pointer"></label>
                                      </div>
                                  </div>
                                  <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                              <select className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-purple-500 focus:border-purple-500">
                                                  <option>Daily</option>
                                                  <option selected>Weekly</option>
                                                  <option>Monthly</option>
                                              </select>
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">Time (UTC)</label>
                                              <input type="time" value="02:00" className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-purple-500 focus:border-purple-500" />
                                          </div>
                                      </div>
                                      
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-2">Data to Include</label>
                                          <div className="grid grid-cols-2 gap-2">
                                              <label className="flex items-center space-x-2 text-sm text-gray-600">
                                                  <input type="checkbox" checked className="rounded text-purple-600 focus:ring-purple-500" />
                                                  <span>Payment Records</span>
                                              </label>
                                              <label className="flex items-center space-x-2 text-sm text-gray-600">
                                                  <input type="checkbox" checked className="rounded text-purple-600 focus:ring-purple-500" />
                                                  <span>Property Owners</span>
                                              </label>
                                              <label className="flex items-center space-x-2 text-sm text-gray-600">
                                                  <input type="checkbox" checked className="rounded text-purple-600 focus:ring-purple-500" />
                                                  <span>Tenant Records</span>
                                              </label>
                                              <label className="flex items-center space-x-2 text-sm text-gray-600">
                                                  <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500" />
                                                  <span>System Logs</span>
                                              </label>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                      <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">Save Schedule</button>
                                  </div>
                              </div>
      
                              
                              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                      <i data-lucide="hard-drive" className="w-5 h-5 text-gray-600 mr-2"></i> Storage
                                  </h3>
                                  <div className="space-y-4">
                                      <div>
                                          <div className="flex justify-between text-sm mb-1">
                                              <span className="font-medium text-gray-700">Used Space</span>
                                              <span className="text-gray-500">2.4 GB / 10 GB</span>
                                          </div>
                                          <div className="w-full bg-gray-100 rounded-full h-2">
                                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "24%" }}></div>
                                          </div>
                                      </div>
                                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                          <p className="text-xs text-blue-700">
                                              <i data-lucide="info" className="w-3 h-3 inline mr-1"></i>
                                              Backups are retained for 30 days automatically. Older backups are deleted to save space.
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          </div>
      
                          
                          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                  <h3 className="text-md font-semibold text-gray-800">Backup History</h3>
                              </div>
                              <div className="overflow-x-auto">
                                  <table className="w-full data-table">
                                      <thead>
                                          <tr>
                                              <th>Date Created</th>
                                              <th>Type</th>
                                              <th>Size</th>
                                              <th>Modules Included</th>
                                              <th>Status</th>
                                              <th className="text-right">Actions</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          
                                          <tr>
                                              <td className="text-sm text-gray-700">Oct 24, 2025  02:00 AM</td>
                                              <td><span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Automated</span></td>
                                              <td className="font-mono text-xs text-gray-600">128 MB</td>
                                              <td className="text-xs text-gray-500">Payments, Users, Properties</td>
                                              <td>
                                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                      Completed
                                                  </span>
                                              </td>
                                              <td className="text-right">
                                                  <button className="text-purple-600 hover:text-purple-800 mx-1" title="Download"><i data-lucide="download" className="w-4 h-4"></i></button>
                                                  <button className="text-blue-600 hover:text-blue-800 mx-1" title="Restore"><i data-lucide="refresh-ccw" className="w-4 h-4"></i></button>
                                              </td>
                                          </tr>
      
                                          
                                          <tr>
                                              <td className="text-sm text-gray-700">Oct 17, 2025  02:00 AM</td>
                                              <td><span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Automated</span></td>
                                              <td className="font-mono text-xs text-gray-600">125 MB</td>
                                              <td className="text-xs text-gray-500">Payments, Users, Properties</td>
                                              <td>
                                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                      Completed
                                                  </span>
                                              </td>
                                              <td className="text-right">
                                                  <button className="text-purple-600 hover:text-purple-800 mx-1" title="Download"><i data-lucide="download" className="w-4 h-4"></i></button>
                                                  <button className="text-blue-600 hover:text-blue-800 mx-1" title="Restore"><i data-lucide="refresh-ccw" className="w-4 h-4"></i></button>
                                              </td>
                                          </tr>
      
                                           
                                          <tr>
                                              <td className="text-sm text-gray-700">Oct 15, 2025  04:30 PM</td>
                                              <td><span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700">Manual</span></td>
                                              <td className="font-mono text-xs text-gray-600">124 MB</td>
                                              <td className="text-xs text-gray-500">Full System Backup</td>
                                              <td>
                                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                      Completed
                                                  </span>
                                              </td>
                                              <td className="text-right">
                                                  <button className="text-purple-600 hover:text-purple-800 mx-1" title="Download"><i data-lucide="download" className="w-4 h-4"></i></button>
                                                  <button className="text-blue-600 hover:text-blue-800 mx-1" title="Restore"><i data-lucide="refresh-ccw" className="w-4 h-4"></i></button>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  </main>
              </div>
      
              
              <div id="mobile-overlay" className="fixed inset-0 bg-black/50 z-30 hidden md:hidden backdrop-blur-sm" onClick={function(event) { try { return Function('event', "toggleMobileMenu()").call(event.currentTarget, event); } catch (err) { console.error(err); } }}></div>
              <aside id="mobile-sidebar" className="fixed inset-y-0 left-0 w-72 bg-[#111827] z-40 transform -translate-x-full transition-transform duration-300 md:hidden flex flex-col overflow-y-auto">
                  <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 sticky top-0 bg-[#111827]">
                       <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
                       <button id="mobile-menu-close"><i data-lucide="x" className="w-6 h-6 text-gray-400"></i></button>
                  </div>
                  <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
              </aside>
          </div>
      
          
          <div id="manualBackupModal" className="modal fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal>
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden onClick={function(event) { try { return Function('event', "toggleModal('manualBackupModal')").call(event.currentTarget, event); } catch (err) { console.error(err); } }}></div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden>&#8203;</span>
      
                  <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                      <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                          <div className="flex justify-between items-center mb-4">
                               <h3 className="text-lg leading-6 font-bold text-gray-900">Initiate Manual Backup</h3>
                               <button onClick={function(event) { try { return Function('event', "toggleModal('manualBackupModal')").call(event.currentTarget, event); } catch (err) { console.error(err); } }} className="text-gray-400 hover:text-gray-500"><i data-lucide="x" className="w-5 h-5"></i></button>
                          </div>
                          
                          <p className="text-sm text-gray-500 mb-4">This will create a complete snapshot of your database. This process may take a few minutes.</p>
                          
                          <form className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Modules</label>
                                  <div className="space-y-2">
                                      <label className="flex items-center">
                                          <input type="checkbox" checked className="rounded text-purple-600 focus:ring-purple-500 mr-2" />
                                          <span className="text-sm text-gray-700">All Payment Data</span>
                                      </label>
                                      <label className="flex items-center">
                                          <input type="checkbox" checked className="rounded text-purple-600 focus:ring-purple-500 mr-2" />
                                          <span className="text-sm text-gray-700">Property Owners & Properties</span>
                                      </label>
                                      <label className="flex items-center">
                                          <input type="checkbox" checked className="rounded text-purple-600 focus:ring-purple-500 mr-2" />
                                          <span className="text-sm text-gray-700">Tenant Records & Documents</span>
                                      </label>
                                  </div>
                              </div>
                               <div>
                                  <label className="block text-sm font-medium text-gray-700">Backup Label (Optional)</label>
                                  <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="e.g. Pre-Update Snapshot" />
                              </div>
                          </form>
                      </div>
                      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                          <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none sm:w-auto sm:text-sm">
                              Start Backup
                          </button>
                          <button type="button" className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm" onClick={function(event) { try { return Function('event', "toggleModal('manualBackupModal')").call(event.currentTarget, event); } catch (err) { console.error(err); } }}>
                              Cancel
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      
          
              
      
    </div>
  );
}




