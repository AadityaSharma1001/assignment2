import { useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { socket } from "../utils/socket";
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";

console.log('🔥 HOME SCREEN FILE LOADED');

// 💡 Use env-based endpoint for GraphQL
const GRAPHQL_ENDPOINT =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.135.110:4000/graphql";

// 🎯 GraphQL query
const GET_EVENTS = gql`
  query GetEvents {
    getEvents {
      id
      title
      description
      startTime
      attendees {
        id
        name
      }
    }
  }
`;

// 🧠 Query function for React Query
const fetchEvents = async () => {
  console.log('🚀 Fetching events from:', GRAPHQL_ENDPOINT);
  
  try {
    const data = await request(GRAPHQL_ENDPOINT, GET_EVENTS);
    console.log('📝 Raw GraphQL response:', data);
    console.log('📅 Events array:', data.getEvents);
    return data.getEvents;
  } catch (error) {
    console.error('💥 GraphQL fetch error:', error);
    throw error;
  }
};

// 🗓️ Helper function to check if event is before yesterday
const isEventBeforeYesterday = (eventStartTime) => {
  if (!eventStartTime) return true; // Hide events with no date
  
  try {
    const timestamp = typeof eventStartTime === 'string' ? parseInt(eventStartTime) : eventStartTime;
    const eventDate = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(eventDate.getTime())) {
      console.warn('Invalid event date:', eventStartTime);
      return true; // Hide invalid dates
    }
    
    // Get yesterday's date at 00:00:00
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Set event date to start of day for comparison
    const eventDateStart = new Date(eventDate);
    eventDateStart.setHours(0, 0, 0, 0);
    
    const isBeforeYesterday = eventDateStart.getTime() < yesterday.getTime();
    
    console.log('Date comparison:', {
      eventDate: eventDate.toISOString(),
      yesterday: yesterday.toISOString(),
      isBeforeYesterday
    });
    
    return isBeforeYesterday;
  } catch (error) {
    console.error('Error checking event date:', error, eventStartTime);
    return true; // Hide events with date parsing errors
  }
};

export default function HomeScreen() {
  console.log('🏠 HomeScreen function called - COMPONENT IS RENDERING');
  
  // Temporary alert to confirm component is running
  useEffect(() => {
    console.log('🚨 COMPONENT MOUNTED - CHECK CONSOLE');
  }, []);
  
  const router = useRouter();
  const { user, logout } = useAuthStore();

  console.log('👤 User state:', user);
  console.log('🔗 GraphQL Endpoint:', GRAPHQL_ENDPOINT);

  const {
    data: rawEvents,
    isLoading,
    isError,
    refetch,
    error,
  } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      console.log('✅ Query success, events:', data);
    },
    onError: (error) => {
      console.log('❌ Query error:', error);
    },
  });

  // 🎯 Filter events to exclude those before yesterday
  const events = useMemo(() => {
    if (!rawEvents) return [];
    
    const filteredEvents = rawEvents.filter(event => !isEventBeforeYesterday(event.startTime));
    
    console.log('📊 Event filtering:', {
      totalEvents: rawEvents.length,
      filteredEvents: filteredEvents.length,
      hiddenEvents: rawEvents.length - filteredEvents.length
    });
    
    return filteredEvents;
  }, [rawEvents]);

  console.log('📊 Query state - Loading:', isLoading, 'Error:', isError, 'Raw Events:', rawEvents?.length, 'Filtered Events:', events?.length);

  const handleCancelled = useCallback(
    (payload: { eventId: string }) => {
      console.log("Event Cancelled (Home):", payload.eventId);
      refetch();
    },
    [refetch]
  );

  useEffect(() => {
    const handleUserJoined = (payload: { eventId: string; user: any }) => {
      console.log("✅ User joined:", payload.user.name);
      refetch();
    };

    const handleUserLeft = (payload: { eventId: string; user: any }) => {
      console.log("👋 User left:", payload.user.name);
      refetch();
    };

    socket.on("userJoinedEvent", handleUserJoined);
    socket.on("userLeftEvent", handleUserLeft);
    console.log("📡 Registered userJoinedEvent & userLeftEvent listeners");

    return () => {
      socket.off("userJoinedEvent", handleUserJoined);
      socket.off("userLeftEvent", handleUserLeft);
      console.log("📴 Unregistered userJoinedEvent & userLeftEvent listeners");
    };
  }, [refetch]);
  
  useEffect(() => {
    const handleNewEvent = () => {
      console.log("📅 New event created");
      refetch(); // Refresh the event list
    };

    socket.on("newEventCreated", handleNewEvent);

    return () => {
      socket.off("newEventCreated", handleNewEvent);
    };
  }, [refetch]);

  useEffect(() => {
    if (!socket.connected) {
      console.log("🔌 Connecting from Home...");
      socket.connect();
    }
    socket.off("eventCancelled");
    socket.on("eventCancelled", (payload) => handleCancelled(payload));

    return () => {
      socket.off("eventCancelled", handleCancelled);
      console.log("🧷 Unregistered eventCancelled in Home");
    };
  }, [handleCancelled]);

  const formatDateTime = (dateString) => {
    // Handle timestamp format (which is what we're receiving)
    let date;
    
    if (!dateString) {
      return 'No date provided';
    }
    
    try {
      // Convert to number if it's a string timestamp
      const timestamp = typeof dateString === 'string' ? parseInt(dateString) : dateString;
      
      // Create date from timestamp (assuming it's in milliseconds)
      date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid timestamp:', dateString);
        return `Invalid Date`;
      }
      
      // Debug log to verify parsing
      console.log('Parsed timestamp:', timestamp, 'to date:', date.toString());
      
    } catch (error) {
      console.error('Error parsing timestamp:', error, dateString);
      return `Error parsing date`;
    }
    
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Format options
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    const dateOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    };
    
    const timeString = date.toLocaleTimeString('en-US', timeOptions);
    
    // Show relative dates for nearby events
    if (diffDays === 0) {
      return `Today at ${timeString}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${timeString}`;
    } else if (diffDays === -1) {
      return `Yesterday at ${timeString}`;
    } else if (diffDays > 1 && diffDays <= 7) {
      return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${timeString}`;
    } else {
      return `${date.toLocaleDateString('en-US', dateOptions)} at ${timeString}`;
    }
  };

  const renderEventCard = ({ item }) => {
    console.log('Rendering event card for:', item.title, 'startTime:', item.startTime);
    
    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/event/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.attendeeBadge}>
            <Text style={styles.attendeeCount}>{item.attendees.length}</Text>
          </View>
        </View>
        
        <Text style={styles.eventDescription} numberOfLines={3}>
          {item.description}
        </Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.dateTime}>
            📅 {formatDateTime(item.startTime)}
          </Text>
          <Text style={styles.attendeeText}>
            👥 {item.attendees.length} {item.attendees.length === 1 ? 'attendee' : 'attendees'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No Current Events</Text>
      <Text style={styles.emptySubtitle}>
        {user ? "Be the first to create an amazing event!" : "Login to start creating events"}
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.loadingText}>Loading events...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Unable to Load Events</Text>
      <Text style={styles.errorSubtitle}>Please check your connection and try again</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Debug: Log the events data
  console.log('Events data:', events);
  console.log('Is loading:', isLoading);
  console.log('Is error:', isError);

  if (isLoading) return renderLoadingState();
  if (isError || !rawEvents) return renderErrorState();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Events</Text>
            <Text style={styles.headerSubtitle}>
              {user ? `Welcome back, ${user.name || 'User'}!` : 'Discover amazing events'}
            </Text>
          </View>
          
          {user ? (
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.authButton} 
              onPress={() => router.push("/auth")}
            >
              <Text style={styles.authButtonText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Create Event Section */}
        <View style={styles.actionSection}>
          {user ? (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push("/create")}
              activeOpacity={0.9}
            >
              <Text style={styles.createButtonIcon}>+</Text>
              <Text style={styles.createButtonText}>Create New Event</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.loginPromptCard}>
              <Text style={styles.loginPromptIcon}>🔐</Text>
              <Text style={styles.loginPromptText}>Login to create and join events</Text>
              <TouchableOpacity 
                style={styles.loginPromptButton}
                onPress={() => router.push("/auth")}
              >
                <Text style={styles.loginPromptButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Events List */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>
            {events.length > 0 ? `${events.length} Event${events.length === 1 ? '' : 's'} Available` : ''}
          </Text>
          
          {events.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={events}
              keyExtractor={(item) => item.id}
              renderItem={renderEventCard}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={refetch}
                  colors={['#6366F1']}
                  tintColor="#6366F1"
                />
              }
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  authButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#6366F1',
    borderRadius: 12,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loginPromptCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  loginPromptIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  loginPromptButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginPromptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eventsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  listContainer: {
    paddingBottom: 20,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  attendeeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 32,
    alignItems: 'center',
  },
  attendeeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  eventDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateTime: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
  },
  attendeeText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F8FAFC',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});