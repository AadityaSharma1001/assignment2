// app/event/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, ActivityIndicator } from "react-native";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useAuthStore } from "../../store/authStore";
import { useEffect, useState, useCallback } from "react";
import { socket } from "../../utils/socket";

const GET_EVENT = gql`
  query GetEventById($id: String!) {
    getEventById(id: $id) {
      id
      title
      description
      startTime
      creator {
        id
      }
      attendees {
        id
        name
      }
    }
  }
`;

const JOIN_EVENT = gql`
  mutation JoinEvent($eventId: String!) {
    joinEvent(eventId: $eventId) {
      id
      attendees {
        id
        name
      }
    }
  }
`;

const LEAVE_EVENT = gql`
  mutation LeaveEvent($eventId: String!) {
    leaveEvent(eventId: $eventId) {
      id
      attendees {
        id
        name
      }
    }
  }
`;

const CANCEL_EVENT = gql`
  mutation CancelEvent($eventId: String!) {
    cancelEvent(eventId: $eventId)
  }
`;

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const eventId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  const { user } = useAuthStore();
  const router = useRouter();
  const userId = user?.id;

  const { data, loading, error, refetch } = useQuery(GET_EVENT, {
    variables: { id: eventId },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const [attendees, setAttendees] = useState([]);
  const [joinEvent] = useMutation(JOIN_EVENT);
  const [leaveEvent] = useMutation(LEAVE_EVENT);
  const [cancelEvent] = useMutation(CANCEL_EVENT);

  useEffect(() => {
    if (data?.getEventById?.attendees) {
      setAttendees(data.getEventById.attendees);
    }
  }, [data]);

  useEffect(() => {
    const handleUserJoined = (payload: {
      eventId: string;
      user: { id: string; name: string };
    }) => {
      if (payload.eventId === eventId) {
        console.log("🎉 User joined:", payload.user);
        setAttendees((prev) => [...prev, payload.user]);
      }
    };

    socket.on("userJoinedEvent", handleUserJoined);

    return () => {
      socket.off("userJoinedEvent", handleUserJoined);
    };
  }, [eventId]);

  useEffect(() => {
    const handleUserLeft = (payload: {
      eventId: string;
      user: { id: string; name: string };
    }) => {
      if (payload.eventId === eventId) {
        console.log("👋 User left event:", payload.user.name);
        refetch({ fetchPolicy: "network-only" })
          .then(() => console.log("🔁 Refetched after user left"))
          .catch((err) => console.error("❌ Refetch failed", err));
      }
    };

    socket.on("userLeftEvent", handleUserLeft);
    console.log("📡 Registered userLeftEvent listener");

    socket.onAny((event, payload) => {
      console.log(`📡 Received event: ${event}`, payload);
    });

    return () => {
      socket.off("userLeftEvent", handleUserLeft);
    };
  }, [eventId]);

  const handleJoin = async () => {
    console.log("👉 Joining event:", eventId);
    await joinEvent({ variables: { eventId } });
    refetch();
  };

  const handleLeave = async () => {
    await leaveEvent({ variables: { eventId } });
    refetch();
  };

  const handleCancel = async () => {
    await cancelEvent({ variables: { eventId } });
    router.replace("/");
  };

  const formatDateTime = (dateString: string) => {
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
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    const dateOptions: Intl.DateTimeFormatOptions = {
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

  const getEventStatus = () => {
    const now = new Date();
    const startTime = data?.getEventById?.startTime;
    
    if (!startTime) {
      return { text: "No Date", color: "#6B7280", bg: "#F3F4F6" };
    }
    
    let eventDate;
    try {
      // Use same parsing logic as formatDateTime
      const timestamp = typeof startTime === 'string' ? parseInt(startTime) : startTime;
      eventDate = new Date(timestamp);
      
      if (isNaN(eventDate.getTime())) {
        return { text: "Invalid Date", color: "#EF4444", bg: "#FEE2E2" };
      }
    } catch (error) {
      console.error('Error parsing event date:', error);
      return { text: "Date Error", color: "#EF4444", bg: "#FEE2E2" };
    }
    
    if (eventDate > now) {
      const timeDiff = eventDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysUntil === 0) return { text: "Today", color: "#F59E0B", bg: "#FEF3C7" };
      if (daysUntil === 1) return { text: "Tomorrow", color: "#10B981", bg: "#D1FAE5" };
      if (daysUntil <= 7) return { text: `In ${daysUntil} days`, color: "#6366F1", bg: "#EEF2FF" };
      return { text: `In ${daysUntil} days`, color: "#6B7280", bg: "#F3F4F6" };
    }
    return { text: "Past Event", color: "#EF4444", bg: "#FEE2E2" };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (error) {
    console.error("Error fetching event:", error);
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#EF4444" />
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>Unable to load event details</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const event = data.getEventById;
  const isCreator = event.creator.id === userId;
  const isAttending = attendees.some((a) => a.id === userId);
  const eventStatus = getEventStatus();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Event Card */}
        <View style={styles.eventCard}>
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: eventStatus.bg }]}>
            <Text style={[styles.statusText, { color: eventStatus.color }]}>
              {eventStatus.text}
            </Text>
          </View>

          {/* Event Title */}
          <Text style={styles.eventTitle}>{event.title}</Text>
          
          {/* Event Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionLabel}>About this event</Text>
            <Text style={styles.eventDescription}>{event.description}</Text>
          </View>

          {/* Date Time Section */}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeIcon}>
              <Text style={styles.dateTimeIconText}>📅</Text>
            </View>
            <View style={styles.dateTimeInfo}>
              <Text style={styles.dateTimeLabel}>When</Text>
              <Text style={styles.dateTimeValue}>
                {formatDateTime(event.startTime)}
              </Text>
            </View>
          </View>

          {/* Attendees Section */}
          <View style={styles.attendeesSection}>
            <View style={styles.attendeesHeader}>
              <View style={styles.attendeesIcon}>
                <Text style={styles.attendeesIconText}>👥</Text>
              </View>
              <View>
                <Text style={styles.attendeesLabel}>Attendees</Text>
                <Text style={styles.attendeesCount}>
                  {attendees.length} {attendees.length === 1 ? 'person' : 'people'} attending
                </Text>
              </View>
            </View>

            {attendees.length > 0 && (
              <View style={styles.attendeesList}>
                {attendees.map((attendee, index) => (
                  <View key={attendee.id} style={styles.attendeeItem}>
                    <View style={styles.attendeeAvatar}>
                      <Text style={styles.attendeeInitial}>
                        {attendee.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.attendeeName}>{attendee.name}</Text>
                    {attendee.id === userId && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>You</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          {user ? (
            isCreator ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>🗑️ Cancel Event</Text>
              </TouchableOpacity>
            ) : isAttending ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.leaveButton]} 
                onPress={handleLeave}
                activeOpacity={0.8}
              >
                <Text style={styles.leaveButtonText}>👋 Leave Event</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionButton, styles.joinButton]} 
                onPress={handleJoin}
                activeOpacity={0.8}
              >
                <Text style={styles.joinButtonText}>🎉 Join Event</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>
                Please log in to join this event
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: -10,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 24,
    lineHeight: 34,
  },
  descriptionContainer: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  dateTimeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dateTimeIconText: {
    fontSize: 20,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  attendeesSection: {
    marginBottom: 8,
  },
  attendeesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  attendeesIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  attendeesIconText: {
    fontSize: 20,
  },
  attendeesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  attendeesCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  attendeesList: {
    marginTop: 8,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  attendeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendeeInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  attendeeName: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  youBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  youBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  actionButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  joinButton: {
    backgroundColor: '#10B981',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  leaveButton: {
    backgroundColor: '#F59E0B',
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loginPrompt: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  loginPromptText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});