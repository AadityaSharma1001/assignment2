// app/create.tsx 
import { useState } from "react"; 
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Keyboard, 
  Platform,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native"; 
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { gql, useMutation } from "@apollo/client"; 
import { useRouter } from "expo-router"; 
 
const CREATE_EVENT = gql` 
  mutation CreateEvent( 
    $title: String! 
    $description: String! 
    $startTime: String! 
  ) { 
    createEvent(title: $title, description: $description, startTime: $startTime) { 
      id 
      title 
    } 
  } 
`; 
 
export default function CreateEventScreen() { 
  const [title, setTitle] = useState(""); 
  const [desc, setDesc] = useState(""); 
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isFocused, setIsFocused] = useState({ title: false, desc: false });
 
  const [createEvent] = useMutation(CREATE_EVENT); 
  const router = useRouter(); 
 
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    setSelectedDate(date);
    hideDatePicker();
  };
 
  const handleSubmit = async () => { 
    if (!title.trim() || !desc.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    Keyboard.dismiss(); 
 
    try { 
      await createEvent({ 
        variables: { 
          title: title.trim(), 
          description: desc.trim(), 
          startTime: selectedDate.toISOString(), 
        }, 
      }); 
      router.replace("/"); 
    } catch (err) { 
      console.error("Create event error:", err);
      Alert.alert("Error", "Failed to create event. Please try again.");
    } 
  }; 

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  };
 
  return ( 
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerGradient}>
          <Text style={styles.headerTitle}>Create Event</Text>
          <Text style={styles.headerSubtitle}>Plan something amazing</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Card */}
        <View style={styles.formCard}>
          
          {/* Title Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Event Title</Text>
            <View style={[
              styles.inputContainer, 
              isFocused.title && styles.inputContainerFocused
            ]}>
              <TextInput 
                style={styles.input} 
                placeholder="Enter event title" 
                placeholderTextColor="#9CA3AF"
                value={title} 
                onChangeText={setTitle}
                onFocus={() => setIsFocused({...isFocused, title: true})}
                onBlur={() => setIsFocused({...isFocused, title: false})}
              /> 
            </View>
          </View>
          
          {/* Description Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Description</Text>
            <View style={[
              styles.inputContainer, 
              styles.textAreaContainer,
              isFocused.desc && styles.inputContainerFocused
            ]}>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Tell us more about your event..." 
                placeholderTextColor="#9CA3AF"
                value={desc} 
                onChangeText={setDesc} 
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => setIsFocused({...isFocused, desc: true})}
                onBlur={() => setIsFocused({...isFocused, desc: false})}
              /> 
            </View>
          </View>
 
          {/* Date Time Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Start Time</Text>
            <TouchableOpacity 
              style={styles.dateTimeCard} 
              onPress={showDatePicker}
              activeOpacity={0.7}
            >
              <View style={styles.dateTimeContent}>
                <View>
                  <Text style={styles.dateTimeLabel}>Selected Date & Time</Text>
                  <Text style={styles.dateTimeValue}>
                    {formatDate(selectedDate)}
                  </Text>
                </View>
                <View style={styles.calendarIcon}>
                  <Text style={styles.calendarIconText}>📅</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!title.trim() || !desc.trim()) && styles.submitButtonDisabled
            ]} 
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!title.trim() || !desc.trim()}
          >
            <Text style={styles.submitButtonText}>Create Event</Text>
            <Text style={styles.submitButtonIcon}>✨</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={selectedDate}
        minimumDate={new Date()}
      />
    </View> 
  ); 
} 
 
const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC'
  },
  headerSection: {
    backgroundColor: '#6366f1',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerGradient: {
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 32, 
    fontWeight: "800", 
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    transition: 'all 0.2s ease',
  },
  inputContainerFocused: {
    borderColor: '#6366f1',
    backgroundColor: '#FFFFFF',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: { 
    padding: 16, 
    fontSize: 16,
    color: '#111827',
    fontWeight: '400',
  },
  textAreaContainer: {
    minHeight: 120,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  dateTimeCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  dateTimeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  calendarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIconText: {
    fontSize: 20,
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  submitButtonIcon: {
    fontSize: 18,
  },
});