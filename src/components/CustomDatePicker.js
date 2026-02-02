import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomDatePicker = ({ visible, onClose, onSelect, initialDate }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [currentMonth, setCurrentMonth] = useState(initialDate || new Date());

  useEffect(() => {
    if (visible && initialDate) {
        setSelectedDate(initialDate);
        setCurrentMonth(initialDate);
    }
  }, [visible, initialDate]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (increment) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentMonth(newDate);
  };

  const handleDayPress = (day) => {
    const newDate = new Date(currentMonth);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const handleOk = () => {
    onSelect(selectedDate);
    onClose();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = 
        selectedDate.getDate() === i &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();

      const isToday = 
        new Date().getDate() === i &&
        new Date().getMonth() === currentMonth.getMonth() &&
        new Date().getFullYear() === currentMonth.getFullYear();

      days.push(
        <TouchableOpacity
          key={i}
          style={[styles.dayCell, isSelected && styles.selectedDayCell]}
          onPress={() => handleDayPress(i)}
        >
          <Text style={[
            styles.dayText, 
            isSelected && styles.selectedDayText,
            isToday && !isSelected && styles.todayText
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerLabel}>SELECT DATE</Text>
                <Text style={styles.headerDate}>{formattedDate}</Text>
              </View>

              {/* Calendar Controls */}
              <View style={styles.calendarControls}>
                <Text style={styles.monthTitle}>
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
                <View style={styles.arrows}>
                  <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
                    <Ionicons name="chevron-back" size={24} color="#5f6368" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
                    <Ionicons name="chevron-forward" size={24} color="#5f6368" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Week Days */}
              <View style={styles.weekDaysRow}>
                {weekDays.map((day, index) => (
                  <Text key={index} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {renderCalendar()}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity onPress={onClose} style={styles.actionButton}>
                  <Text style={styles.actionText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleOk} style={styles.actionButton}>
                  <Text style={styles.actionText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 28, // Material 3 style
    width: 320,
    paddingVertical: 16,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 12,
    color: '#5f6368',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 32,
    color: '#000',
    fontWeight: '400',
  },
  calendarControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12, // Adjusted for alignment
    marginBottom: 10,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginLeft: 12,
  },
  arrows: {
    flexDirection: 'row',
  },
  arrowButton: {
    padding: 12,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  weekDayText: {
    fontSize: 12,
    color: '#5f6368',
    width: 36,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    height: 240, // Fixed height to prevent jumping
  },
  dayCell: {
    width: '14.28%', // 100% / 7
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  selectedDayCell: {
    backgroundColor: '#52d017', // App green
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
    color: '#000',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayText: {
    color: '#52d017',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
  },
  actionText: {
    color: '#52d017',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default CustomDatePicker;
