#!/usr/bin/env python3
"""
Live System Testing Guide
Step-by-step testing of the actual running system
Organized in tests/ directory for better project structure
"""

import requests
from datetime import datetime, timedelta

class LiveSystemTester:
    def __init__(self):
        self.base_url = 'http://localhost:5000'
        
    def check_server_status(self):
        """Check if server is running"""
        print("🔍 CHECKING SERVER STATUS")
        print("-" * 30)
        
        try:
            response = requests.get(f'{self.base_url}/api/dashboard/stats', timeout=5)
            if response.status_code == 200:
                print("✅ Server is running and responding")
                stats = response.json()
                print(f"   📊 System Status: {stats['system_status']}")
                print(f"   🚌 Total Buses: {stats['total_buses']}")
                print(f"   🎫 Total Bookings: {stats['total_bookings']}")
                return True
            else:
                print(f"❌ Server responding with error: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print("❌ Server is not running")
            print("💡 Start server with: python run_enhanced.py")
            return False
        except Exception as e:
            print(f"❌ Error checking server: {e}")
            return False
    
    def test_public_interface(self):
        """Test public booking interface"""
        print("\n📱 TESTING PUBLIC INTERFACE")
        print("-" * 30)
        
        try:
            # 1. Get available routes
            print("1. Getting available routes...")
            routes_response = requests.get(f'{self.base_url}/api/routes')
            if routes_response.status_code == 200:
                routes = routes_response.json()
                print(f"   ✅ Found {len(routes)} routes")
                for route in routes:
                    print(f"      🛣️  {route['name']}: ${route['price']:.2f}")
            else:
                print(f"   ❌ Failed to get routes: {routes_response.status_code}")
                return False
            
            # 2. Get buses for first route
            if routes:
                route = routes[0]
                print(f"\n2. Getting buses for {route['name']}...")
                buses_response = requests.get(f'{self.base_url}/api/buses/{route["id"]}')
                if buses_response.status_code == 200:
                    buses = buses_response.json()
                    print(f"   ✅ Found {len(buses)} buses")
                    for bus in buses:
                        print(f"      🚌 {bus['bus_number']}: {bus['available_seats']}/{bus['capacity']} seats")
                else:
                    print(f"   ❌ Failed to get buses: {buses_response.status_code}")
                    return False
            
            # 3. Create a test booking
            if routes and buses:
                print(f"\n3. Creating test booking...")
                bus = buses[0]
                booking_data = {
                    'passenger_name': f'Live Test User {datetime.now().strftime("%H%M%S")}',
                    'passenger_email': f'livetest{datetime.now().strftime("%H%M%S")}@example.com',
                    'passenger_phone': f'+1-555-{datetime.now().strftime("%H%M%S")}',
                    'bus_id': bus['id'],
                    'route_id': route['id'],
                    'pickup_stop_id': route['stops'][0]['id'],
                    'dropoff_stop_id': route['stops'][-1]['id'],
                    'travel_date': (datetime.now() + timedelta(hours=2)).isoformat()
                }
                
                booking_response = requests.post(
                    f'{self.base_url}/api/book-enhanced',
                    json=booking_data,
                    headers={'Content-Type': 'application/json'}
                )
                
                if booking_response.status_code == 200:
                    booking = booking_response.json()
                    print(f"   ✅ Booking created successfully!")
                    print(f"      🆔 ID: {booking['booking_id']}")
                    print(f"      💺 Seat: {booking['seat_number']}")
                    print(f"      📱 QR: {booking['qr_code']}")
                    return booking
                else:
                    print(f"   ❌ Booking failed: {booking_response.status_code}")
                    print(f"   Response: {booking_response.text}")
                    return False
            
            return True
            
        except Exception as e:
            print(f"❌ Public interface test error: {e}")
            return False
    
    def test_staff_interface(self):
        """Test staff interface"""
        print("\n👨‍💼 TESTING STAFF INTERFACE")
        print("-" * 30)
        
        try:
            # 1. Get staff alerts
            print("1. Getting staff alerts...")
            alerts_response = requests.get(f'{self.base_url}/api/staff/alerts')
            if alerts_response.status_code == 200:
                alerts = alerts_response.json()
                print(f"   ✅ Found {len(alerts)} alerts")
                for alert in alerts[:3]:
                    print(f"      ⚠️  {alert['title']} ({alert['severity']})")
            else:
                print(f"   ❌ Failed to get alerts: {alerts_response.status_code}")
                return False
            
            # 2. Get bus information
            print("\n2. Getting assigned bus info...")
            bus_response = requests.get(f'{self.base_url}/api/staff/my-bus?staff_id=1')
            if bus_response.status_code == 200:
                bus_info = bus_response.json()
                print(f"   ✅ Bus info retrieved")
                print(f"      🚌 Bus: {bus_info['bus_number']}")
                print(f"      📅 Today's bookings: {bus_info['today_bookings']}")
                print(f"      💺 Available seats: {bus_info['available_seats']}")
            else:
                print(f"   ❌ Failed to get bus info: {bus_response.status_code}")
                return False
            
            # 3. Test alert acknowledgment
            if alerts:
                print("\n3. Testing alert acknowledgment...")
                alert_id = alerts[0]['id']
                ack_response = requests.post(
                    f'{self.base_url}/api/staff/alerts/{alert_id}/acknowledge',
                    json={'user_id': 1},
                    headers={'Content-Type': 'application/json'}
                )
                
                if ack_response.status_code == 200:
                    print(f"   ✅ Alert {alert_id} acknowledged")
                else:
                    print(f"   ❌ Alert acknowledgment failed: {ack_response.status_code}")
            
            return True
            
        except Exception as e:
            print(f"❌ Staff interface test error: {e}")
            return False
    
    def test_manager_interface(self):
        """Test manager interface"""
        print("\n👩‍💼 TESTING MANAGER INTERFACE")
        print("-" * 30)
        
        try:
            # 1. Get manager overview
            print("1. Getting manager overview...")
            overview_response = requests.get(f'{self.base_url}/api/manager/overview')
            if overview_response.status_code == 200:
                overview = overview_response.json()
                print(f"   ✅ Manager overview retrieved")
                print(f"      📊 Total bookings: {overview['overview']['total_bookings']}")
                print(f"      💰 Revenue: ${overview['overview']['total_revenue']:.2f}")
                print(f"      🚌 Active buses: {overview['overview']['active_buses']}")
            else:
                print(f"   ❌ Failed to get overview: {overview_response.status_code}")
                return False
            
            # 2. Get manager alerts
            print("\n2. Getting manager alerts...")
            alerts_response = requests.get(f'{self.base_url}/api/manager/alerts')
            if alerts_response.status_code == 200:
                alerts = alerts_response.json()
                print(f"   ✅ Found {len(alerts)} manager alerts")
                for alert in alerts[:2]:
                    print(f"      ⚠️  {alert['title']} (Priority: {alert['priority']})")
            else:
                print(f"   ❌ Failed to get manager alerts: {alerts_response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Manager interface test error: {e}")
            return False
    
    def test_queue_monitoring(self):
        """Test queue monitoring system"""
        print("\n📊 TESTING QUEUE MONITORING")
        print("-" * 30)
        
        try:
            # 1. Get real-time queue data
            print("1. Getting real-time queue data...")
            queue_response = requests.get(f'{self.base_url}/api/realtime/queue')
            if queue_response.status_code == 200:
                queues = queue_response.json()
                print(f"   ✅ Monitoring {len(queues)} stops")
                
                # Show first 3 stops
                for stop_id, queue_info in list(queues.items())[:3]:
                    status = "🟢" if queue_info['length'] <= 3 else "🟡" if queue_info['length'] <= 8 else "🔴"
                    print(f"      {status} {queue_info['stop_name']}: {queue_info['length']} people")
            else:
                print(f"   ❌ Failed to get queue data: {queue_response.status_code}")
                return False
            
            # 2. Test specific stop prediction
            if queues:
                stop_id = list(queues.keys())[0]
                print(f"\n2. Getting prediction for stop {stop_id}...")
                prediction_response = requests.get(f'{self.base_url}/api/queue/{stop_id}')
                if prediction_response.status_code == 200:
                    prediction = prediction_response.json()
                    print(f"   ✅ Prediction retrieved")
                    print(f"      📊 Current: {prediction['current_queue']['length']} people")
                    print(f"      🔮 Next hour: {prediction['predicted_next_hour']['length']} people")
                    print(f"      💡 Recommendation: {prediction['recommendation']}")
                else:
                    print(f"   ❌ Failed to get prediction: {prediction_response.status_code}")
                    return False
            
            return True
            
        except Exception as e:
            print(f"❌ Queue monitoring test error: {e}")
            return False
    
    def run_live_system_test(self):
        """Run complete live system test"""
        print("🧪 LIVE SYSTEM TESTING")
        print("=" * 50)
        print("Testing the actual running system...")
        
        # Check if server is running
        if not self.check_server_status():
            print("\n❌ Server is not running!")
            print("🚀 Start the server first with:")
            print("   python run_enhanced.py")
            return False
        
        # Run all tests
        test_results = {}
        test_results['public_interface'] = self.test_public_interface()
        test_results['staff_interface'] = self.test_staff_interface()
        test_results['manager_interface'] = self.test_manager_interface()
        test_results['queue_monitoring'] = self.test_queue_monitoring()
        
        # Print summary
        print("\n" + "=" * 50)
        print("🧪 LIVE SYSTEM TEST RESULTS")
        print("=" * 50)
        
        passed_tests = 0
        total_tests = len(test_results)
        
        for test_name, result in test_results.items():
            if result:
                print(f"✅ {test_name.replace('_', ' ').title()}")
                passed_tests += 1
            else:
                print(f"❌ {test_name.replace('_', ' ').title()}")
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"\n📊 Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
        
        if success_rate == 100:
            print("🎉 ALL LIVE SYSTEM TESTS PASSED!")
            print("✅ Your system is working perfectly!")
        elif success_rate >= 75:
            print("✅ System is mostly working with minor issues")
        else:
            print("❌ System has significant issues")
        
        return success_rate >= 75

def main():
    """Main function"""
    tester = LiveSystemTester()
    success = tester.run_live_system_test()
    
    if success:
        print("\n🎉 Live system testing completed successfully!")
    else:
        print("\n❌ Live system testing found issues!")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
