# 🧪 How to Run Tests - Smart Queue Management System

## 📋 **Testing Overview**

The Smart Queue Management System includes comprehensive testing to ensure all features work correctly:

- **Live System Tests** - Test the actual running system
- **Feature Demonstrations** - Showcase all functionality
- **Manual Testing** - Step-by-step verification

## 🚀 **Quick Start Testing**

### **1. Start the System**
```bash
# Option 1: Python launcher
python run_enhanced.py

# Option 2: Windows batch file
start_system.bat
```

### **2. Run Live System Tests**
```bash
# From project root
python tests/test_live_system.py
```

### **3. Run Feature Demonstration**
```bash
# From project root  
python tests/demo_all_features.py
```

## 🔍 **Test Details**

### **Live System Tests (`tests/test_live_system.py`)**

**What it tests:**
- ✅ Server connectivity and status
- ✅ Public booking interface
- ✅ Staff operations interface
- ✅ Manager dashboard
- ✅ Real-time queue monitoring
- ✅ AI prediction system

**Sample Output:**
```
🧪 LIVE SYSTEM TESTING
==================================================
🔍 CHECKING SERVER STATUS
✅ Server is running and responding
   📊 System Status: operational
   🚌 Total Buses: 3
   🎫 Total Bookings: 15

📱 TESTING PUBLIC INTERFACE
✅ Found 3 routes
✅ Found 3 buses
✅ Booking created successfully!

👨‍💼 TESTING STAFF INTERFACE
✅ Found 8 alerts
✅ Bus info retrieved
✅ Alert 1 acknowledged

👩‍💼 TESTING MANAGER INTERFACE
✅ Manager overview retrieved
✅ Found 3 manager alerts

📊 TESTING QUEUE MONITORING
✅ Monitoring 12 stops
✅ Prediction retrieved

📊 Success Rate: 100.0% (4/4)
🎉 ALL LIVE SYSTEM TESTS PASSED!
```

### **Feature Demonstration (`tests/demo_all_features.py`)**

**What it demonstrates:**
- 🚀 Automatic server startup
- 📊 System overview and statistics
- 🛣️ Route and bus management
- 🎫 Enhanced booking with QR codes
- 📊 Real-time queue monitoring
- 👨‍💼 Staff interface operations
- 👩‍💼 Manager dashboard analytics
- 🛑 Graceful system shutdown

**Sample Output:**
```
🎬 SMART QUEUE MANAGEMENT SYSTEM
🎯 COMPLETE FEATURE DEMONSTRATION
============================================================
🚀 Starting Enhanced Smart Queue Management System...
✅ Enhanced Backend Server Started Successfully!

📊 SYSTEM OVERVIEW & STATISTICS
🚌 Total Buses: 3
🛣️  Total Routes: 3
🎫 Total Bookings: 0
💰 Total Revenue: $0.00
🟢 System Status: OPERATIONAL

🛣️  ROUTE & BUS MANAGEMENT
📍 Available Routes: 3
1. Downtown Express
   📍 Central Station → Business District
   ⏱️  Duration: 45 minutes
   💵 Price: $5.50

🎫 ENHANCED BOOKING SYSTEM WITH QR CODES
✅ BOOKING SUCCESSFUL!
   🆔 Booking ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   💺 Seat Number: 1
   📱 QR Code: QR_A1B2C3D4
   🖼️  QR Image: Generated (Base64 encoded)

🎯 DEMONSTRATION SUMMARY
============================================================
✅ System Overview
✅ Route Management
✅ Booking System
✅ Queue Monitoring
✅ Staff Interface
✅ Manager Dashboard

📊 Success Rate: 100.0% (6/6)
🎉 ALL FEATURES WORKING PERFECTLY!
```

## 🔧 **Manual Testing**

### **1. Public Interface Testing**
1. Open http://localhost:8080
2. Select a route from dropdown
3. Choose pickup and dropoff stops
4. Fill passenger details
5. Click "Book Now"
6. Verify QR code generation

### **2. Staff Interface Testing**
1. Open http://localhost:8080/staff.html
2. Check alert notifications
3. Test QR code scanning
4. Acknowledge alerts
5. View bus information

### **3. Manager Interface Testing**
1. Open http://localhost:8080/manager.html
2. Review system overview
3. Check route analytics
4. Monitor system health
5. Manage alerts

## 🐛 **Troubleshooting Tests**

### **Common Issues:**

**❌ Server not running:**
```
❌ Server is not running
💡 Start server with: python run_enhanced.py
```
**Solution:** Start the backend server first

**❌ Connection refused:**
```
❌ Error checking server: Connection refused
```
**Solution:** Check if port 5000 is available

**❌ Import errors:**
```
ModuleNotFoundError: No module named 'flask'
```
**Solution:** Install dependencies: `pip install -r requirements.txt`

### **Test Environment Requirements:**
- ✅ Python 3.7+
- ✅ All dependencies installed
- ✅ Backend server running
- ✅ Ports 5000 and 8080 available

## 📊 **Test Coverage**

### **Backend API Tests:**
- ✅ All 15+ API endpoints
- ✅ Database operations
- ✅ QR code generation
- ✅ Alert system
- ✅ AI predictions

### **Frontend Tests:**
- ✅ All 3 user interfaces
- ✅ Real-time updates
- ✅ Form validations
- ✅ Interactive features

### **Integration Tests:**
- ✅ End-to-end booking flow
- ✅ Staff operations workflow
- ✅ Manager analytics
- ✅ Real-time monitoring

## 🎯 **Success Criteria**

**✅ Tests Pass When:**
- All API endpoints respond correctly
- Database operations work
- QR codes generate properly
- Real-time updates function
- All interfaces load and work
- No critical errors in logs

**❌ Tests Fail When:**
- Server connectivity issues
- Database errors
- Missing dependencies
- Port conflicts
- API response errors

Run tests regularly to ensure system reliability! 🚀
