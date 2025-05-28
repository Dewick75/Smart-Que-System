#!/usr/bin/env python3
"""
Enhanced Smart Queue Management System - Complete System Launcher
Launches backend with enhanced features and opens all role-based interfaces
"""

import subprocess
import webbrowser
import time
import threading
import os
import sys
from pathlib import Path
import requests

def serve_frontend():
    """Serve frontend via HTTP server"""
    import http.server
    import socketserver
    import os
    
    os.chdir('frontend')
    
    class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
    
    with socketserver.TCPServer(("", 8080), MyHTTPRequestHandler) as httpd:
        print("🌐 Frontend server started at http://localhost:8080")
        httpd.serve_forever()

def open_interfaces():
    """Open interfaces via HTTP server"""
    time.sleep(5)  # Wait for both servers to start
    
    interfaces = {
        '📱 Public Interface': 'http://localhost:8080/index.html',
        '👨‍💼 Staff Interface': 'http://localhost:8080/staff.html',
        '👩‍💼 Manager Dashboard': 'http://localhost:8080/manager.html'
    }
    
    print("🌐 Opening interfaces...")
    for name, url in interfaces.items():
        print(f"   {name}: {url}")
        webbrowser.open(url)
        time.sleep(1)

def print_header():
    """Print startup header"""
    print("🚌" + "=" * 70 + "🚌")
    print("    ENHANCED SMART QUEUE MANAGEMENT SYSTEM LAUNCHER")
    print("=" * 72)
    print("🎯 ENHANCED FEATURES:")
    print("   ✅ Visual QR Codes (like professional ticket system)")
    print("   ✅ Interactive Staff Alerts with Actions")
    print("   ✅ Manager Dashboard with Analytics")
    print("   ✅ Role-Based Access Control")
    print("   ✅ Real-time Updates & Notifications")
    print("   ✅ Enhanced Database with User Roles")
    print("=" * 72)

def check_requirements():
    """Check if all required packages are installed"""
    required_packages = [
        ('flask', 'Flask'),
        ('flask_sqlalchemy', 'Flask-SQLAlchemy'),
        ('flask_cors', 'Flask-CORS'),
        ('numpy', 'numpy'),
        ('sklearn', 'scikit-learn'),
        ('joblib', 'joblib'),
        ('qrcode', 'qrcode[pil]'),
        ('PIL', 'Pillow'),
        ('requests', 'requests')
    ]
    
    missing_packages = []
    
    print("📋 Checking system requirements...")
    
    for package_import, package_name in required_packages:
        try:
            __import__(package_import)
            print(f"   ✅ {package_name}")
        except ImportError:
            missing_packages.append(package_name)
            print(f"   ❌ {package_name}")
    
    if missing_packages:
        print(f"\n💡 Install missing packages with:")
        print(f"   pip install {' '.join(missing_packages)}")
        return False
    
    print("✅ All requirements satisfied!")
    return True

def check_file_structure():
    """Check if required files exist"""
    required_files = {
        'backend/enhanced_app.py': 'Enhanced Backend Server',
        'frontend/index.html': 'Public Interface',
        'frontend/staff.html': 'Staff Interface', 
        'frontend/manager.html': 'Manager Dashboard',
        'frontend/css/style.css': 'Public CSS',
        'frontend/css/staff-style.css': 'Staff CSS',
        'frontend/js/app.js': 'Public JavaScript',
        'frontend/js/staff-app.js': 'Staff JavaScript'
    }
    
    print("\n📁 Checking file structure...")
    
    missing_files = []
    for file_path, description in required_files.items():
        if os.path.exists(file_path):
            print(f"   ✅ {description}")
        else:
            missing_files.append(f"{file_path} ({description})")
            print(f"   ❌ {description}")
    
    if missing_files:
        print(f"\n💡 Missing files:")
        for file in missing_files:
            print(f"   - {file}")
        print("\n📝 Please create the missing files as per the implementation guide.")
        return False
    
    print("✅ All required files found!")
    return True

def create_directory_structure():
    """Create directory structure if it doesn't exist"""
    directories = [
        'backend',
        'frontend',
        'frontend/css',
        'frontend/js',
        'database'
    ]
    
    print("\n📂 Creating directory structure...")
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"   ✅ {directory}/")
    
    print("✅ Directory structure ready!")

def run_enhanced_backend():
    """Run the enhanced Flask backend server"""
    try:
        print("🚀 Starting Enhanced Backend Server...")
        print("   - Enhanced role-based API endpoints")
        print("   - Interactive alert system")
        print("   - Visual QR code generation")
        print("   - Real-time queue management")
        
        # Change to backend directory and add to Python path
        backend_path = os.path.join(os.getcwd(), 'backend')
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)
        
        # Import and run the enhanced Flask app
        os.chdir('backend')
        from enhanced_app import app # ← This should be enhanced_app, not run_enhanced
        
        print("✅ Enhanced backend modules loaded")
        print("🔥 Starting Flask server on http://localhost:5000")
        
        # Run the Flask app
        app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False, threaded=True)
        
    except ImportError as e:
        print(f"❌ Error importing enhanced_app: {e}")
        print("💡 Make sure enhanced_app.py exists in the backend/ folder")
        print(f"💡 Current working directory: {os.getcwd()}")
        print(f"💡 Backend path: {os.path.join(os.getcwd(), 'backend')}")
        print(f"💡 Enhanced_app.py exists: {os.path.exists('backend/enhanced_app.py')}")
        return False
    except Exception as e:
        print(f"❌ Error starting enhanced backend: {e}")
        return False

def check_backend_health():
    """Check if backend is responding"""
    max_retries = 15
    print("⏳ Waiting for backend to start...")
    
    for i in range(max_retries):
        try:
            response = requests.get('http://localhost:5000/api/dashboard/stats', timeout=3)
            if response.status_code == 200:
                print("✅ Enhanced backend is healthy and responding")
                return True
        except requests.exceptions.RequestException:
            pass
        
        print(f"   ⏳ Attempt {i+1}/{max_retries} - Backend starting...")
        time.sleep(2)
    
    print("❌ Backend health check failed")
    return False

def open_interfaces():
    """Open all role-based interfaces in browser"""
    time.sleep(3)  # Wait a bit for backend to fully start
    
    interfaces = {
        '📱 Public Interface (Passengers)': {
            'file': 'frontend/index.html',
            'description': 'Book seats, get QR codes'
        },
        '👨‍💼 Staff Interface': {
            'file': 'frontend/staff.html', 
            'description': 'Interactive alerts, QR scanning'
        },
        '👩‍💼 Manager Dashboard': {
            'file': 'frontend/manager.html',
            'description': 'Analytics, reports, system overview'
        }
    }
    
    print("🌐 Opening enhanced interfaces...")
    
    for name, info in interfaces.items():
        file_path = os.path.abspath(info['file'])
        if os.path.exists(info['file']):
            url = f'file://{file_path}'
            print(f"   {name}")
            print(f"     📂 {url}")
            print(f"     📝 {info['description']}")
            webbrowser.open(url)
            time.sleep(1.5)
        else:
            print(f"   ❌ {name} - File not found: {info['file']}")

def print_api_endpoints():
    """Print available API endpoints"""
    print("\n🔧 ENHANCED API ENDPOINTS:")
    print("=" * 40)
    
    endpoints = {
        'Public APIs': [
            'GET  /api/routes - Get all routes',
            'POST /api/book-enhanced - Create booking with QR',
            'GET  /api/queue/{stop_id} - Get queue status',
            'GET  /api/dashboard/stats - System statistics'
        ],
        'Staff APIs': [
            'GET  /api/staff/alerts - Get staff alerts',
            'POST /api/staff/alerts/{id}/acknowledge - Acknowledge alert',
            'POST /api/staff/alerts/{id}/resolve - Resolve alert',
            'POST /api/staff/scan-qr - Scan passenger QR code',
            'GET  /api/staff/my-bus - Get bus information'
        ],
        'Manager APIs': [
            'GET  /api/manager/overview - Dashboard overview',
            'GET  /api/manager/alerts - Manager alerts',
            'GET  /api/manager/route-analytics/{id} - Route analytics'
        ]
    }
    
    for category, apis in endpoints.items():
        print(f"\n🔹 {category}:")
        for api in apis:
            print(f"   {api}")

def print_success_info():
    """Print success information and instructions"""
    print("\n🎉 ENHANCED SYSTEM SUCCESSFULLY LAUNCHED!")
    print("=" * 72)
    print("🌟 WHAT'S RUNNING:")
    print("   🔧 Enhanced Backend API: http://localhost:5000")
    print("   📱 Public Interface: Enhanced booking with visual QR codes")
    print("   👨‍💼 Staff Interface: Interactive alerts and QR scanning")
    print("   👩‍💼 Manager Dashboard: Complete analytics and insights")
    
    print("\n💡 HOW TO USE:")
    print("   1️⃣  Make bookings through Public Interface")
    print("   2️⃣  View interactive alerts in Staff Interface")  
    print("   3️⃣  Monitor system through Manager Dashboard")
    print("   4️⃣  Test QR code scanning between interfaces")
    
    print("\n🔥 NEW ENHANCED FEATURES:")
    print("   ✅ Visual QR codes with passenger information")
    print("   ✅ Interactive staff alerts with action buttons")
    print("   ✅ Real-time manager dashboard with KPIs")
    print("   ✅ Role-based access and separate interfaces")
    print("   ✅ Enhanced database with user management")
    
    print("\n⚠️  CONTROLS:")
    print("   🛑 Press Ctrl+C to stop the enhanced system")
    print("   🔄 Refresh browser pages to see real-time updates")
    print("   🐛 Check terminal for debug information")

def print_troubleshooting():
    """Print troubleshooting information"""
    print("\n🔧 TROUBLESHOOTING:")
    print("-" * 30)
    print("❌ Backend won't start:")
    print("   → Check enhanced_app.py exists in backend/")
    print("   → Install missing packages: pip install -r requirements.txt")
    print("   → Check port 5000 is not in use")
    
    print("\n❌ Interfaces won't open:")
    print("   → Check HTML files exist in frontend/")
    print("   → Try opening files manually")
    print("   → Check browser allows local file access")
    
    print("\n❌ Features not working:")
    print("   → Wait for backend to fully start (30 seconds)")
    print("   → Check browser console for errors")
    print("   → Verify API endpoints: http://localhost:5000/api/dashboard/stats")

def handle_shutdown():
    """Handle graceful shutdown"""
    print("\n\n🛑 ENHANCED SYSTEM SHUTDOWN INITIATED...")
    print("👋 Thank you for using Enhanced Smart Queue Management System!")
    print("💫 All enhanced features have been demonstrated successfully!")

def main():
    """Main function to launch the enhanced system"""
    try:
        # Print header
        print_header()
        
        # Check requirements
        if not check_requirements():
            print("\n❌ System requirements not met. Please install missing packages.")
            return
        
        # Create directory structure  
        create_directory_structure()
        
        # Check file structure
        if not check_file_structure():
            print("\n❌ Required files missing. Please follow the implementation guide.")
            return
        
        print("\n🚀 LAUNCHING ENHANCED SYSTEM...")
        print("=" * 40)
        
        # Start backend in separate thread
        backend_thread = threading.Thread(target=run_enhanced_backend)
        backend_thread.daemon = True
        backend_thread.start()
        
        # Start frontend server in separate thread
        frontend_thread = threading.Thread(target=serve_frontend)
        frontend_thread.daemon = True
        frontend_thread.start()
        
        # Check backend health
        if not check_backend_health():
            print("❌ Failed to start enhanced backend. Check errors above.")
            return
        
        # Open interfaces
        open_interfaces()
        
        # Print API information
        print_api_endpoints()
        
        # Print success information
        print_success_info()
        
        # Keep main thread alive
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            handle_shutdown()
            
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print_troubleshooting()
    except KeyboardInterrupt:
        handle_shutdown()

if __name__ == "__main__":
    main()