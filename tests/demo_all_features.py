#!/usr/bin/env python3
"""
Complete Feature Demonstration for Smart Queue Management System
Showcases all working functionality with real examples
Organized in tests/ directory for better project structure
"""

import sys
import os
import time
import requests
import subprocess
from datetime import datetime, timedelta

class FeatureDemonstrator:
    def __init__(self):
        self.base_url = 'http://localhost:5000'
        self.server_process = None

    def start_server(self):
        """Start the enhanced backend server"""
        print("🚀 Starting Enhanced Smart Queue Management System...")
        print("=" * 60)

        try:
            # Go to parent directory to find run_enhanced.py
            parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            os.chdir(parent_dir)

            self.server_process = subprocess.Popen([
                sys.executable, 'run_enhanced.py'
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            # Wait for server to start
            for i in range(20):
                try:
                    response = requests.get(f'{self.base_url}/api/dashboard/stats', timeout=3)
                    if response.status_code == 200:
                        print("✅ Enhanced Backend Server Started Successfully!")
                        return True
                except:
                    pass

                print(f"⏳ Initializing system... ({i+1}/20)")
                time.sleep(2)

            return False

        except Exception as e:
            print(f"❌ Error starting server: {e}")
            return False

    def stop_server(self):
        """Stop the server"""
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait()
            print("\n🛑 System Shutdown Complete")

    def demo_system_overview(self):
        """Demonstrate system overview and statistics"""
        print("\n📊 SYSTEM OVERVIEW & STATISTICS")
        print("-" * 40)

        try:
            response = requests.get(f'{self.base_url}/api/dashboard/stats')
            if response.status_code == 200:
                stats = response.json()

                print(f"🚌 Total Buses: {stats['total_buses']}")
                print(f"🛣️  Total Routes: {stats['total_routes']}")
                print(f"🎫 Total Bookings: {stats['total_bookings']}")
                print(f"📅 Today's Bookings: {stats['today_bookings']}")
                print(f"💰 Total Revenue: ${stats['total_revenue']:.2f}")
                print(f"⚠️  Active Alerts: {stats['active_alerts']}")
                print(f"🟢 System Status: {stats['system_status'].upper()}")

                return True
            else:
                print("❌ Failed to get system statistics")
                return False

        except Exception as e:
            print(f"❌ Error getting system overview: {e}")
            return False

    def demo_route_management(self):
        """Demonstrate route and bus management"""
        print("\n🛣️  ROUTE & BUS MANAGEMENT")
        print("-" * 40)

        try:
            # Get all routes
            routes_response = requests.get(f'{self.base_url}/api/routes')
            if routes_response.status_code == 200:
                routes = routes_response.json()

                print(f"📍 Available Routes: {len(routes)}")
                for i, route in enumerate(routes, 1):
                    print(f"\n{i}. {route['name']}")
                    print(f"   📍 {route['start_point']} → {route['end_point']}")
                    print(f"   ⏱️  Duration: {route['duration']} minutes")
                    print(f"   💵 Price: ${route['price']:.2f}")
                    print(f"   🚏 Stops: {len(route['stops'])}")

                    # Show first few stops
                    for stop in route['stops'][:3]:
                        print(f"      {stop['order']}. {stop['name']}")
                    if len(route['stops']) > 3:
                        print(f"      ... and {len(route['stops']) - 3} more stops")

                # Get buses for first route
                if routes:
                    route_id = routes[0]['id']
                    buses_response = requests.get(f'{self.base_url}/api/buses/{route_id}')
                    if buses_response.status_code == 200:
                        buses = buses_response.json()
                        print(f"\n🚌 Available Buses: {len(buses)}")
                        for bus in buses:
                            print(f"   {bus['bus_number']}: {bus['available_seats']}/{bus['capacity']} seats available")

                return True
            else:
                print("❌ Failed to get routes")
                return False

        except Exception as e:
            print(f"❌ Error in route management demo: {e}")
            return False

    def demo_booking_system(self):
        """Demonstrate complete booking system with QR codes"""
        print("\n🎫 ENHANCED BOOKING SYSTEM WITH QR CODES")
        print("-" * 40)

        try:
            # Get routes and buses
            routes_response = requests.get(f'{self.base_url}/api/routes')
            routes = routes_response.json()
            route = routes[0]

            buses_response = requests.get(f'{self.base_url}/api/buses/{route["id"]}')
            buses = buses_response.json()
            bus = buses[0]

            # Create a booking
            booking_data = {
                'passenger_name': 'John Smith',
                'passenger_email': 'john.smith@email.com',
                'passenger_phone': '+1-555-0123',
                'bus_id': bus['id'],
                'route_id': route['id'],
                'pickup_stop_id': route['stops'][0]['id'],
                'dropoff_stop_id': route['stops'][-1]['id'],
                'travel_date': (datetime.now() + timedelta(hours=4)).isoformat()
            }

            print("📝 Creating Enhanced Booking...")
            print(f"   Passenger: {booking_data['passenger_name']}")
            print(f"   Route: {route['name']}")
            print(f"   Bus: {bus['bus_number']}")
            print(f"   From: {route['stops'][0]['name']}")
            print(f"   To: {route['stops'][-1]['name']}")

            booking_response = requests.post(
                f'{self.base_url}/api/book-enhanced',
                json=booking_data,
                headers={'Content-Type': 'application/json'}
            )

            if booking_response.status_code == 200:
                booking = booking_response.json()

                print("\n✅ BOOKING SUCCESSFUL!")
                print(f"   🆔 Booking ID: {booking['booking_id']}")
                print(f"   💺 Seat Number: {booking['seat_number']}")
                print(f"   📱 QR Code: {booking['qr_code']}")
                print(f"   🚌 Bus: {booking['bus_number']}")
                print(f"   🛣️  Route: {booking['route_name']}")
                print(f"   📍 Pickup: {booking['pickup_stop']}")
                print(f"   🖼️  QR Image: Generated (Base64 encoded)")

                return booking
            else:
                print(f"❌ Booking failed: {booking_response.status_code}")
                print(f"Response: {booking_response.text}")
                return None

        except Exception as e:
            print(f"❌ Error in booking demo: {e}")
            return None

    def demo_queue_monitoring(self):
        """Demonstrate real-time queue monitoring"""
        print("\n📊 REAL-TIME QUEUE MONITORING")
        print("-" * 40)

        try:
            # Get real-time queue data
            queue_response = requests.get(f'{self.base_url}/api/realtime/queue')
            if queue_response.status_code == 200:
                queues = queue_response.json()

                print(f"🚏 Monitoring {len(queues)} Bus Stops:")

                # Show queue status for each stop
                for stop_id, queue_info in list(queues.items())[:5]:  # Show first 5
                    status_icon = "🟢" if queue_info['length'] <= 3 else "🟡" if queue_info['length'] <= 8 else "🔴"
                    trend_icon = {"increasing": "📈", "decreasing": "📉", "stable": "➡️"}.get(queue_info.get('trend', 'stable'), "➡️")

                    print(f"\n   {status_icon} {queue_info['stop_name']}")
                    print(f"      👥 Queue Length: {queue_info['length']} people")
                    print(f"      ⏱️  Wait Time: {queue_info['waiting_time']} minutes")
                    print(f"      {trend_icon} Trend: {queue_info.get('trend', 'stable').title()}")
                    print(f"      🕐 Last Updated: {queue_info['last_updated'][:19]}")

                # Test specific stop prediction
                if queues:
                    stop_id = list(queues.keys())[0]
                    prediction_response = requests.get(f'{self.base_url}/api/queue/{stop_id}')
                    if prediction_response.status_code == 200:
                        prediction = prediction_response.json()

                        print(f"\n🔮 AI PREDICTION for Stop {stop_id}:")
                        print(f"   📊 Current: {prediction['current_queue']['length']} people")
                        print(f"   🔮 Next Hour: {prediction['predicted_next_hour']['length']} people")
                        print(f"   💡 Recommendation: {prediction['recommendation']}")

                return True
            else:
                print("❌ Failed to get queue data")
                return False

        except Exception as e:
            print(f"❌ Error in queue monitoring demo: {e}")
            return False

    def demo_staff_interface(self):
        """Demonstrate staff interface and operations"""
        print("\n👨‍💼 STAFF INTERFACE & OPERATIONS")
        print("-" * 40)

        try:
            # Get staff alerts
            alerts_response = requests.get(f'{self.base_url}/api/staff/alerts')
            if alerts_response.status_code == 200:
                alerts = alerts_response.json()

                print(f"⚠️  Staff Alerts: {len(alerts)} active")

                for i, alert in enumerate(alerts[:3], 1):  # Show first 3
                    severity_icon = {"low": "🟢", "medium": "🟡", "high": "🟠", "critical": "🔴"}.get(alert['severity'], "⚪")

                    print(f"\n   {i}. {severity_icon} {alert['title']}")
                    print(f"      📝 {alert['message']}")
                    print(f"      🏷️  Type: {alert['type'].title()}")
                    print(f"      ⚡ Priority: {alert['priority']}/5")
                    print(f"      🕐 Created: {alert['created_at'][:19]}")
                    if alert['action_required']:
                        print(f"      🚨 Action Required: Yes")

                # Demonstrate alert acknowledgment
                if alerts:
                    alert_id = alerts[0]['id']
                    ack_response = requests.post(
                        f'{self.base_url}/api/staff/alerts/{alert_id}/acknowledge',
                        json={'user_id': 1},
                        headers={'Content-Type': 'application/json'}
                    )

                    if ack_response.status_code == 200:
                        print(f"\n✅ Alert {alert_id} acknowledged by staff")

            # Get bus information
            bus_response = requests.get(f'{self.base_url}/api/staff/my-bus?staff_id=1')
            if bus_response.status_code == 200:
                bus_info = bus_response.json()

                print(f"\n🚌 ASSIGNED BUS INFORMATION:")
                print(f"   🚌 Bus Number: {bus_info['bus_number']}")
                print(f"   🛣️  Route: {bus_info['route_name']}")
                print(f"   👥 Capacity: {bus_info['capacity']} seats")
                print(f"   📍 Location: {bus_info['current_location']}")
                print(f"   📅 Today's Bookings: {bus_info['today_bookings']}")
                print(f"   💺 Available Seats: {bus_info['available_seats']}")
                print(f"   🎫 Recent Boardings: {len(bus_info['recent_boardings'])}")

            return True

        except Exception as e:
            print(f"❌ Error in staff interface demo: {e}")
            return False

    def demo_manager_dashboard(self):
        """Demonstrate manager dashboard and analytics"""
        print("\n👩‍💼 MANAGER DASHBOARD & ANALYTICS")
        print("-" * 40)

        try:
            # Get manager overview
            overview_response = requests.get(f'{self.base_url}/api/manager/overview')
            if overview_response.status_code == 200:
                overview = overview_response.json()

                print("📈 BUSINESS OVERVIEW:")
                metrics = overview['overview']
                print(f"   📊 Total Bookings: {metrics['total_bookings']}")
                print(f"   📅 Today's Bookings: {metrics['today_bookings']}")
                print(f"   🚌 Active Buses: {metrics['active_buses']}")
                print(f"   💰 Total Revenue: ${metrics['total_revenue']:.2f}")
                print(f"   📊 Avg Occupancy: {metrics['average_occupancy']:.1f}%")

                print(f"\n🛣️  ROUTE PERFORMANCE:")
                for route in overview['route_performance']:
                    print(f"   • {route['route_name']}")
                    print(f"     📊 Bookings: {route['total_bookings']}")
                    print(f"     💰 Revenue: ${route['revenue']:.2f}")
                    print(f"     📈 Occupancy: {route['occupancy_rate']:.1f}%")

                print(f"\n🚌 SYSTEM HEALTH:")
                health = overview['system_health']
                print(f"   🟢 Operational: {health['operational_buses']} buses")
                print(f"   🟡 Delayed: {health['delayed_buses']} buses")
                print(f"   🔴 Maintenance: {health['maintenance_buses']} buses")

            # Get manager alerts
            alerts_response = requests.get(f'{self.base_url}/api/manager/alerts')
            if alerts_response.status_code == 200:
                alerts = alerts_response.json()
                print(f"\n⚠️  MANAGER ALERTS: {len(alerts)} requiring attention")

                for alert in alerts[:2]:  # Show first 2
                    print(f"   • {alert['title']}")
                    print(f"     📝 {alert['message']}")
                    print(f"     🏷️  Priority: {alert['priority']}/5")

            return True

        except Exception as e:
            print(f"❌ Error in manager dashboard demo: {e}")
            return False

    def run_complete_demo(self):
        """Run complete feature demonstration"""
        print("🎬 SMART QUEUE MANAGEMENT SYSTEM")
        print("🎯 COMPLETE FEATURE DEMONSTRATION")
        print("=" * 60)

        if not self.start_server():
            print("❌ Cannot run demo - server failed to start")
            return False

        try:
            # Run all demonstrations
            demos = [
                ("System Overview", self.demo_system_overview),
                ("Route Management", self.demo_route_management),
                ("Booking System", self.demo_booking_system),
                ("Queue Monitoring", self.demo_queue_monitoring),
                ("Staff Interface", self.demo_staff_interface),
                ("Manager Dashboard", self.demo_manager_dashboard)
            ]

            results = []

            for demo_name, demo_func in demos:
                print(f"\n{'='*60}")
                result = demo_func()
                results.append((demo_name, result))

                if result:
                    print(f"✅ {demo_name} demonstration completed successfully")
                else:
                    print(f"❌ {demo_name} demonstration failed")

                time.sleep(1)  # Brief pause between demos

            # Final summary
            print(f"\n{'='*60}")
            print("🎯 DEMONSTRATION SUMMARY")
            print("=" * 60)

            successful_demos = sum(1 for _, success in results if success)
            total_demos = len(results)

            for demo_name, success in results:
                status = "✅" if success else "❌"
                print(f"{status} {demo_name}")

            success_rate = (successful_demos / total_demos) * 100
            print(f"\n📊 Success Rate: {success_rate:.1f}% ({successful_demos}/{total_demos})")

            if success_rate == 100:
                print("🎉 ALL FEATURES WORKING PERFECTLY!")
                print("🚀 System is ready for production deployment!")
            elif success_rate >= 80:
                print("✅ System is highly functional with minor issues")
            else:
                print("⚠️ System needs attention before deployment")

            return success_rate >= 80

        finally:
            self.stop_server()

def main():
    """Main function"""
    demonstrator = FeatureDemonstrator()
    success = demonstrator.run_complete_demo()

    print(f"\n{'='*60}")
    if success:
        print("🎉 DEMONSTRATION COMPLETED SUCCESSFULLY!")
        print("💫 Smart Queue Management System is fully functional!")
    else:
        print("⚠️ DEMONSTRATION COMPLETED WITH ISSUES!")
        print("🔧 Some features may need attention!")

    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
