import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Platform,
  Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Dimensions } from 'react-native';
// import * as Notifications from 'expo-notifications';

/* Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
}); */

function parseDueDate(str) {
  if (!str || !str.includes('-')) return new Date();
  const [yyyy, mm, dd] = str.split('-');
  return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
}

function formatDueDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function DatePickerField({ value, onChange, containerStyle }) {
  const [show, setShow] = useState(false);
  const date = parseDueDate(value);

  const handleChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) onChange(formatDueDate(selectedDate));
  };

  return (
    <>
      <TouchableOpacity
        style={[ms.input, ms.datePickerBtn, containerStyle]}
        onPress={() => setShow(true)}
        activeOpacity={0.8}
      >
        <Text style={value ? ms.datePickerText : ms.datePickerPlaceholder}>
          {value || '날짜 선택'}
        </Text>
        <Text style={ms.datePickerIcon}>📅</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          locale="ko-KR"
        />
      )}
    </>
  );
}


const PROGRESS_COLORS = ['#6366F1', '#A78BFA', '#EC4899', '#F59E0B', '#22C55E', '#3B82F6'];
const CATEGORIES = ['업무', '개인', '학습', '기타', 'test'];

function EditTaskModal({ visible, task, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('진행중');
  const [category, setCategory] = useState('');
  const [subTasks, setSubTasks] = useState([]);
  const [subTaskInput, setSubTaskInput] = useState('');
  const [showSubTasks, setShowSubTasks] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDueDate(task.dueDate);
      setStatus(task.status);
      setCategory(task.category || '');
      setSubTasks(task.subTasks || []);
      setShowSubTasks(false);
    }
  }, [task]);

  useEffect(() => {
    if (!dueDate) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (parseDueDate(dueDate) < todayStart && status !== '완료') {
      setStatus('지연');
    }
  }, [dueDate]);

  const todayStartModal = new Date();
  todayStartModal.setHours(0, 0, 0, 0);
  const isPastDueModal = dueDate && parseDueDate(dueDate) < todayStartModal;
  const statusOptionsModal = isPastDueModal ? ['지연', '완료'] : ['진행중', '대기', '완료'];

  const addSubTask = () => {
    if (!subTaskInput.trim()) return;
    setSubTasks(prev => [...prev, { id: Date.now(), title: subTaskInput.trim(), done: false }]);
    setSubTaskInput('');
  };
  const toggleSubTask = (id) => {
    setSubTasks(prev => prev.map(st => st.id === id ? { ...st, done: !st.done } : st));
  };
  const deleteSubTask = (id) => {
    setSubTasks(prev => prev.filter(st => st.id !== id));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={ms.overlay}>
        <View style={[ms.box, { maxHeight: '85%' }]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={ms.title}>Task 수정</Text>
          <Text style={ms.label}>제목</Text>
          <TextInput
            style={ms.input}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#6B7280"
          />
          <Text style={ms.label}>마감일</Text>
          <DatePickerField value={dueDate} onChange={setDueDate} />
          <Text style={ms.label}>상태</Text>
          <View style={ms.statusRow}>
            {statusOptionsModal.map(s => (
              <TouchableOpacity
                key={s}
                style={[ms.statusBtn, status === s && ms.statusBtnActive]}
                onPress={() => setStatus(s)}
                activeOpacity={0.8}
              >
                <Text style={[ms.statusBtnText, status === s && ms.statusBtnTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={ms.label}>카테고리</Text>
          <View style={ms.categoryRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[ms.categoryBtn, category === c && ms.categoryBtnActive]}
                onPress={() => setCategory(c)}
                activeOpacity={0.8}
              >
                <Text style={[ms.categoryBtnText, category === c && ms.categoryBtnTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[ms.statusBtn, showSubTasks && ms.statusBtnActive, { marginBottom: 14 }]}
            onPress={() => setShowSubTasks(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={[ms.statusBtnText, showSubTasks && ms.statusBtnTextActive]}>
              세부 Task {subTasks.length > 0 ? `(${subTasks.length})` : '추가'}
            </Text>
          </TouchableOpacity>
          {showSubTasks && (
            <View style={{ marginBottom: 14 }}>
              {subTasks.length === 0 && (
                <Text style={[ms.label, { textAlign: 'center', paddingVertical: 8 }]}>세부 Task가 없습니다.</Text>
              )}
              {subTasks.map(st => (
                <View key={st.id} style={sub.row}>
                  <TouchableOpacity onPress={() => toggleSubTask(st.id)} activeOpacity={0.7} style={[sub.check, st.done && sub.checkDone]}>
                    <Text style={sub.checkText}>{st.done ? '✓' : ''}</Text>
                  </TouchableOpacity>
                  <Text style={[sub.itemTitle, st.done && sub.itemTitleDone]} numberOfLines={2}>{st.title}</Text>
                  <TouchableOpacity onPress={() => deleteSubTask(st.id)} activeOpacity={0.7} style={sub.del}>
                    <Text style={sub.delText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={sub.addRow}>
                <TextInput
                  style={sub.input}
                  value={subTaskInput}
                  onChangeText={setSubTaskInput}
                  placeholder="세부 Task 입력"
                  placeholderTextColor="#4B5563"
                  returnKeyType="done"
                  onSubmitEditing={addSubTask}
                />
                <TouchableOpacity style={sub.addBtn} onPress={addSubTask} activeOpacity={0.8}>
                  <Text style={sub.addBtnText}>추가</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={ms.actions}>
            <TouchableOpacity style={ms.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={ms.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={ms.saveBtn}
              onPress={() => onSave(task.id, { title, dueDate, status: isPastDueModal && status !== '완료' ? '지연' : status, category, subTasks })}
              activeOpacity={0.8}
            >
              <Text style={ms.saveText}>저장</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AddTaskModal({ visible, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('진행중');
  const [category, setCategory] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifOffset, setNotifOffset] = useState(0);
  const [notifHour, setNotifHour] = useState(9);
  const [notifTimePicker, setNotifTimePicker] = useState(false);
  const notifTimeDate = (() => { const d = new Date(); d.setHours(notifHour, 0, 0, 0); return d; })();

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), dueDate, status, category, notifEnabled, notifOffset, notifHour });
    setTitle('');
    setDueDate('');
    setStatus('진행중');
    setCategory('');
    setNotifEnabled(false);
    setNotifOffset(0);
    setNotifHour(9);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={ms.overlay}>
        <View style={ms.box}>
          <Text style={ms.title}>Task 등록</Text>
          <Text style={ms.label}>제목</Text>
          <TextInput
            style={ms.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Task 이름을 입력하세요"
            placeholderTextColor="#6B7280"
          />
          <Text style={ms.label}>마감일</Text>
          <DatePickerField value={dueDate} onChange={setDueDate} />
          <Text style={ms.label}>상태</Text>
          <View style={ms.statusRow}>
            {['진행중', '대기', '완료'].map(s => (
              <TouchableOpacity
                key={s}
                style={[ms.statusBtn, status === s && ms.statusBtnActive]}
                onPress={() => setStatus(s)}
                activeOpacity={0.8}
              >
                <Text style={[ms.statusBtnText, status === s && ms.statusBtnTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={ms.label}>카테고리</Text>
          <View style={ms.categoryRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[ms.categoryBtn, category === c && ms.categoryBtnActive]}
                onPress={() => setCategory(c)}
                activeOpacity={0.8}
              >
                <Text style={[ms.categoryBtnText, category === c && ms.categoryBtnTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* 알림 UI 임시 주석처리
          <Text style={ms.label}>알림</Text>
          <View style={ms.statusRow}>
            <TouchableOpacity
              style={[ms.statusBtn, notifEnabled && ms.statusBtnActive]}
              onPress={() => setNotifEnabled(v => !v)}
              activeOpacity={0.8}
            >
              <Text style={[ms.statusBtnText, notifEnabled && ms.statusBtnTextActive]}>
                {notifEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
          {notifEnabled && (
            <>
              <Text style={ms.label}>알림 시점</Text>
              <View style={ms.statusRow}>
                {[{ label: '당일', value: 0 }, { label: '1일 전', value: 1 }, { label: '3일 전', value: 3 }].map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[ms.statusBtn, notifOffset === opt.value && ms.statusBtnActive]}
                    onPress={() => setNotifOffset(opt.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[ms.statusBtnText, notifOffset === opt.value && ms.statusBtnTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={ms.label}>알림 시간</Text>
              <TouchableOpacity
                style={[ms.input, ms.datePickerBtn]}
                onPress={() => setNotifTimePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={ms.datePickerText}>{String(notifHour).padStart(2, '0')}:00</Text>
                <Text style={ms.datePickerIcon}>🔔</Text>
              </TouchableOpacity>
              {notifTimePicker && (
                <DateTimePicker
                  value={notifTimeDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    if (Platform.OS === 'android') setNotifTimePicker(false);
                    if (date) setNotifHour(date.getHours());
                  }}
                />
              )}
            </>
          )}
          */}
          <View style={ms.actions}>
            <TouchableOpacity style={ms.saveBtn} onPress={handleAdd} activeOpacity={0.8}>
              <Text style={ms.saveText}>등록</Text>
            </TouchableOpacity>
			<TouchableOpacity style={ms.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={ms.cancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function InProgressScreen({ onBack, tasks, onUpdateTask }) {
  const [editTask, setEditTask] = useState(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.75} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>진행중인 Task</Text>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>진행중 Task</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{tasks.length}</Text>
            </View>
          </View>
          {tasks.length === 0 && (
            <Text style={styles.emptyText}>진행중인 Task가 없습니다.</Text>
          )}
          {tasks.map((task, idx) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskRow, idx < tasks.length - 1 && styles.rowDivider]}
              onPress={() => setEditTask(task)}
              activeOpacity={0.7}
            >
              <View style={styles.taskLeft}>
                <View style={[styles.statusDot, styles.dotGreen]} />
                <View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}> {task.dueDate} 마감</Text>
                </View>
              </View>
              <View style={[styles.pill, styles.pillGreen]}>
                <Text style={[styles.pillText, styles.pillTextGreen]}>{task.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <EditTaskModal
        visible={!!editTask}
        task={editTask}
        onClose={() => setEditTask(null)}
        onSave={(id, updates) => {
          onUpdateTask(id, updates);
          setEditTask(null);
        }}
      />
    </SafeAreaView>
  );
}

function TaskDetailScreen({ task, isPast, onBack, onSave, onDelete, onNavigateSubTasks }) {
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [status, setStatus] = useState(task.status || '진행중');
  const [category, setCategory] = useState(task.category || '');
  const [notes, setNotes] = useState(task.notes || '');
  const [progress, setProgress] = useState(task.progress ?? 0);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageAction, setMessageAction] = useState(null);

  const shareCardRef = useRef(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const statusColor = status === '진행중' ? '#22C55E' : status === '완료' ? '#5B6CF8' : status === '지연' ? '#EF4444' : '#F59E0B';

  useEffect(() => {
    if (!dueDate) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (parseDueDate(dueDate) < todayStart && status !== '완료') {
      setStatus('지연');
    }
  }, [dueDate]);

  const todayStartDetail = new Date();
  todayStartDetail.setHours(0, 0, 0, 0);
  const isPastDueDetail = dueDate && parseDueDate(dueDate) < todayStartDetail;
  const statusOptionsDetail = isPastDueDetail ? ['지연', '완료'] : ['진행중', '대기', '완료'];

  // const [notifEnabled, setNotifEnabled] = useState(task.notifEnabled ?? false);
  // const [notifOffset, setNotifOffset] = useState(task.notifOffset ?? 0);
  // const [notifHour, setNotifHour] = useState(task.notifHour ?? 9);
  // const [notifTimePicker, setNotifTimePicker] = useState(false);
  // const notifTimeDate = (() => { const d = new Date(); d.setHours(notifHour, 0, 0, 0); return d; })();

  const handleShare = () => setShareModalVisible(true);

  const handleShareImage = async () => {
    try {
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 });
      setShareModalVisible(false);
      setTimeout(async () => {
        try {
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Task 공유' });
        } catch {}
      }, 150);
    } catch {}
  };

  /* const scheduleNotification = async () => {
    if (task.notifId) {
      await Notifications.cancelScheduledNotificationAsync(task.notifId).catch(() => {});
    }
    if (!notifEnabled || !dueDate) return null;
    const due = parseDueDate(dueDate);
    const trigger = new Date(due);
    trigger.setDate(trigger.getDate() - notifOffset);
    trigger.setHours(notifHour, 0, 0, 0);
    if (trigger <= new Date()) return null;
    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task 마감 알림',
        body: `"${task.title}" ${notifOffset > 0 ? `마감 ${notifOffset}일 전` : '마감일'}입니다.`,
        android: { channelId: 'default' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  }; */

  const handleSave = async () => {
    onSave(task.id, { dueDate, status, category, notes, progress });
  };

  const dotStyle =
    task.status === '진행중' ? styles.dotGreen
    : task.status === '완료' ? styles.dotBlue
    : task.status === '지연' ? styles.dotRed
    : styles.dotAmber;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.75} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { flex: 1 }]}>Task 수정</Text>
        <TouchableOpacity onPress={handleShare} activeOpacity={0.75} style={styles.backBtn}>
          <Text style={styles.backBtnText}>공유</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 제목 */}
        <View style={[styles.card, styles.detailTitleCard]}>
          <View style={[styles.statusDot, dotStyle, styles.detailTitleDot]} />
          <Text style={styles.detailTitleText}>{task.title}</Text>
        </View>

        {/* 필드 */}
        <View style={styles.card}>
		{/* 카테고리 */}
          <View style={[styles.detailFieldBlock, styles.rowDivider]}>
            <Text style={styles.detailFieldLabel}>카테고리</Text>
            {isPast ? (
              <Text style={styles.detailFieldValue}>{category || '-'}</Text>
            ) : (
              <View style={ms.categoryRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[ms.categoryBtn, category === c && ms.categoryBtnActive]}
                    onPress={() => setCategory(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[ms.categoryBtnText, category === c && ms.categoryBtnTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
		
          {/* 등록일 */}
          <View style={[styles.detailFieldBlock, styles.rowDivider]}>
            <Text style={styles.detailFieldLabel}>등록일</Text>
            <Text style={styles.detailFieldValueMuted}>{task.registeredAt ? formatDueDate(parseDueDate(task.registeredAt)) : '-'}</Text>
          </View>

          

          {/* 마감일 */}
          <View style={[styles.detailFieldBlock, styles.rowDivider]}>
            <Text style={styles.detailFieldLabel}>마감일</Text>
            {isPast ? (
              <Text style={styles.detailFieldValue}>{dueDate || '-'}</Text>
            ) : (
              <DatePickerField value={dueDate} onChange={setDueDate} containerStyle={styles.detailInput} />
            )}
          </View>

          {/* 알림 UI 임시 주석처리
          !isPast && (
            <View style={[styles.detailFieldBlock, styles.rowDivider]}>
              <Text style={styles.detailFieldLabel}>알림</Text>
              <TouchableOpacity
                style={[ms.statusBtn, notifEnabled && ms.statusBtnActive]}
                onPress={() => setNotifEnabled(v => !v)}
                activeOpacity={0.8}
              >
                <Text style={[ms.statusBtnText, notifEnabled && ms.statusBtnTextActive]}>
                  {notifEnabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          )
          !isPast && notifEnabled && (
            <>
              <View style={[styles.detailFieldBlock, styles.rowDivider]}>
                <Text style={styles.detailFieldLabel}>알림 시점</Text>
                <View style={ms.statusRow}>
                  {[{ label: '당일', value: 0 }, { label: '1일 전', value: 1 }, { label: '3일 전', value: 3 }].map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[ms.statusBtn, notifOffset === opt.value && ms.statusBtnActive]}
                      onPress={() => setNotifOffset(opt.value)}
                      activeOpacity={0.8}
                    >
                      <Text style={[ms.statusBtnText, notifOffset === opt.value && ms.statusBtnTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={[styles.detailFieldBlock, styles.rowDivider]}>
                <Text style={styles.detailFieldLabel}>알림 시간</Text>
                <TouchableOpacity
                  style={[ms.input, ms.datePickerBtn, styles.detailInput]}
                  onPress={() => setNotifTimePicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={ms.datePickerText}>{String(notifHour).padStart(2, '0')}:00</Text>
                  <Text style={ms.datePickerIcon}>🔔</Text>
                </TouchableOpacity>
                {notifTimePicker && (
                  <DateTimePicker
                    value={notifTimeDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, date) => {
                      if (Platform.OS === 'android') setNotifTimePicker(false);
                      if (date) setNotifHour(date.getHours());
                    }}
                  />
                )}
              </View>
            </>
          )
          */}

          {/* 상태 */}
          <View style={[styles.detailFieldBlock, styles.rowDivider]}>
            <Text style={styles.detailFieldLabel}>상태</Text>
            {isPast ? (
              <View style={[styles.pill, styles.pillBlue]}>
                <Text style={[styles.pillText, styles.pillTextBlue]}>{status}</Text>
              </View>
            ) : (
              <View style={ms.statusRow}>
                {statusOptionsDetail.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[ms.statusBtn, status === s && ms.statusBtnActive]}
                    onPress={() => setStatus(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[ms.statusBtnText, status === s && ms.statusBtnTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 진척률 - 상세 task가 없을 때만 표시 */}
          {!(task.subTasks && task.subTasks.length > 0) && (
            <View style={[styles.detailFieldBlock, styles.rowDivider]}>
              <Text style={styles.detailFieldLabel}>진척률</Text>
              {isPast ? (
                <Text style={styles.detailFieldValue}>{progress}%</Text>
              ) : (
                <View style={styles.progressInputRow}>
                  <TouchableOpacity
                    style={styles.progressAdjBtn}
                    onPress={() => setProgress(p => Math.max(0, p - 5))}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.progressAdjBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.progressInputValue}>{progress}%</Text>
                  <TouchableOpacity
                    style={styles.progressAdjBtn}
                    onPress={() => setProgress(p => Math.min(100, p + 5))}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.progressAdjBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* 특이사항 */}
          <View style={[styles.detailFieldBlock, styles.rowDivider]}>
            <Text style={styles.detailFieldLabel}>특이사항</Text>
            {isPast ? (
              <Text style={styles.detailFieldValue}>{notes || '-'}</Text>
            ) : (
              <TextInput
                style={[ms.input, styles.detailInput, styles.detailNotesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="특이사항을 입력하세요"
                placeholderTextColor="#4B5563"
                multiline
              />
            )}
          </View>

          {/* 세부 Task */}
          <View style={styles.detailFieldBlock}>
            <Text style={styles.detailFieldLabel}>세부 Task</Text>
            <TouchableOpacity
              style={[ms.statusBtn, { paddingHorizontal: 14 }]}
              onPress={onNavigateSubTasks}
              activeOpacity={0.8}
            >
              <Text style={ms.statusBtnText}>
                {task.subTasks && task.subTasks.length > 0
                  ? `${task.subTasks.filter(st => st.done).length}/${task.subTasks.length} 완료  →`
                  : '관리  →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isPast && (
          <View style={styles.detailBtnRow}>
            <TouchableOpacity
              style={[styles.detailBtn, styles.detailDeleteBtn]}
              onPress={() => setDeleteConfirmVisible(true)}
              activeOpacity={0.82}
            >
              <Text style={styles.detailBtnText}>삭제</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.detailBtn, styles.detailSaveBtn]}
              onPress={handleSave}
              activeOpacity={0.82}
            >
              <Text style={styles.detailBtnText}>저장</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={deleteConfirmVisible} transparent animationType="fade">
        <View style={ms.overlay}>
          <View style={ms.box}>
            <Text style={ms.title}>Task 삭제</Text>
            <Text style={[ms.label, { fontSize: 14, color: '#E5E7EB', marginBottom: 24 }]}>
              {`'${task.title}' task를 삭제하시겠습니까?`}
            </Text>
            <View style={ms.actions}>
              <TouchableOpacity
                style={ms.cancelBtn}
                onPress={() => setDeleteConfirmVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={ms.cancelText}>아니오</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ms.saveBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  setDeleteConfirmVisible(false);
                  setMessageText('삭제가 완료되었습니다.');
                  setMessageAction(() => () => onDelete(task.id));
                  setMessageVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={ms.saveText}>예</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={messageVisible} transparent animationType="fade">
        <View style={ms.overlay}>
          <View style={ms.box}>
            <Text style={[ms.label, { fontSize: 15, color: '#E5E7EB', marginBottom: 24, textAlign: 'center' }]}>
              {messageText}
            </Text>
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={[ms.saveBtn, { paddingHorizontal: 40 }]}
                onPress={() => {
                  setMessageVisible(false);
                  if (messageAction) messageAction();
                }}
                activeOpacity={0.8}
              >
                <Text style={ms.saveText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={shareModalVisible} transparent animationType="fade">
        <View style={sc.overlay}>
          <View style={sc.container}>
            <Text style={sc.previewLabel}>공유 미리보기</Text>
            <View ref={shareCardRef} collapsable={false} style={sc.card}>
              <View style={sc.accentBar} />
              <View style={sc.cardBody}>
                <View style={sc.titleRow}>
                  <View style={[sc.dot, { backgroundColor: statusColor }]} />
                  <Text style={sc.titleText} numberOfLines={3}>{task.title}</Text>
                </View>
                <View style={sc.divider} />
                <View style={sc.field}>
                  <Text style={sc.fieldLabel}>카테고리</Text>
                  <Text style={sc.fieldValue}>{category || '-'}</Text>
                </View>
                <View style={sc.divider} />
                <View style={sc.field}>
                  <Text style={sc.fieldLabel}>상태</Text>
                  <View style={[sc.statusBadge, { backgroundColor: statusColor + '33' }]}>
                    <Text style={[sc.statusBadgeText, { color: statusColor }]}>{status}</Text>
                  </View>
                </View>
                {dueDate ? (
                  <>
                    <View style={sc.divider} />
                    <View style={sc.field}>
                      <Text style={sc.fieldLabel}>마감일</Text>
                      <Text style={sc.fieldValue}>{dueDate}</Text>
                    </View>
                  </>
                ) : null}
                <View style={sc.divider} />
                <View style={sc.progressBlock}>
                  <View style={sc.progressLabelRow}>
                    <Text style={sc.fieldLabel}>진척률</Text>
                    <Text style={sc.progressPct}>{progress}%</Text>
                  </View>
                  <View style={sc.trackBg}>
                    <View style={[sc.trackFill, { width: `${progress}%` }]} />
                  </View>
                </View>
                {notes ? (
                  <>
                    <View style={sc.divider} />
                    <View style={sc.notesBlock}>
                      <Text style={sc.fieldLabel}>특이사항</Text>
                      <Text style={sc.notesText}>{notes}</Text>
                    </View>
                  </>
                ) : null}
              </View>
              <Text style={sc.footer}>Task Manager</Text>
            </View>
            <View style={sc.btnRow}>
              <TouchableOpacity style={sc.cancelBtn} onPress={() => setShareModalVisible(false)} activeOpacity={0.8}>
                <Text style={sc.cancelText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={sc.shareBtn} onPress={handleShareImage} activeOpacity={0.8}>
                <Text style={sc.shareBtnText}>Task 공유</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CategoryManageScreen({ tasks, onBack, onCategoryPress }) {
  const catsWithTasks = CATEGORIES.filter(cat => tasks.some(t => t.category === cat));
  const hasUncategorized = tasks.some(t => !t.category);
  const allRows = [...catsWithTasks, ...(hasUncategorized ? ['미분류'] : [])];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.75} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>카테고리별 Task 관리</Text>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          
          {allRows.length === 0 ? (
            <Text style={styles.emptyText}>Task가 없습니다.</Text>
          ) : allRows.map((cat, idx) => {
            const catTasks = cat === '미분류'
              ? tasks.filter(t => !t.category)
              : tasks.filter(t => t.category === cat);
            const inProg = catTasks.filter(t => t.status === '진행중').length;
            const done = catTasks.filter(t => t.status === '완료').length;
            const total = catTasks.length;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.taskRow, idx < allRows.length - 1 && styles.rowDivider]}
                onPress={() => onCategoryPress(cat)}
                activeOpacity={0.7}
              >
                <View style={styles.taskLeft}>
                  <View style={[styles.statusDot, { backgroundColor: cat === '미분류' ? '#6B7280' : PROGRESS_COLORS[CATEGORIES.indexOf(cat) % PROGRESS_COLORS.length] }]} />
                  <View>
                    <Text style={styles.taskTitle}>{cat}</Text>
                    <Text style={styles.taskMeta}>진행중 {inProg} · 완료 {done} / 전체 {total}</Text>
                  </View>
                </View>
                <Text style={{ color: '#6B7280', fontSize: 20, fontWeight: '300' }}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryDetailScreen({ category, tasks, onBack, onTaskPress }) {
  const [taskFilter, setTaskFilter] = useState('현재');

  const catTasks = category === '미분류'
    ? tasks.filter(t => !t.category)
    : tasks.filter(t => t.category === category);

  const inProgressTasks = catTasks
    .filter(t => t.status === '진행중')
    .sort((a, b) => parseDueDate(a.dueDate) - parseDueDate(b.dueDate));
  const totalCompleted = catTasks.filter(t => t.status === '완료').length;
  const totalAll = catTasks.length;
  const avgAchievement = totalAll > 0
    ? Math.round(catTasks.reduce((sum, t) => sum + (t.progress ?? 0), 0) / totalAll)
    : 0;

  const pastTasksList = catTasks
    .filter(t => t.status === '완료')
    .map(t => ({ id: t.id, title: t.title, doneAt: t.dueDate, category: t.category || '-' }));

  const STATUS_ORDER = { '진행중': 0, '지연': 1, '대기': 2, '완료': 3 };
  const sortByStatusThenDue = (a, b) => {
    const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (so !== 0) return so;
    return parseDueDate(a.dueDate) - parseDueDate(b.dueDate);
  };

  const displayedTasks = taskFilter === '전체'
    ? [...catTasks].sort(sortByStatusThenDue)
    : [...catTasks].filter(t => t.status !== '완료').sort(sortByStatusThenDue);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.75} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{category}</Text>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard2}>
            <Text style={styles.statValue}>{inProgressTasks.length}</Text>
            <Text style={styles.statLabel2}>진행중</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={[styles.statValue, styles.statValueLight]}>{avgAchievement}%</Text>
            <Text style={[styles.statLabel, styles.statLabelLight]}>평균 달성률</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCompleted}</Text>
            <Text style={styles.statLabel}>완료됨</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Task 목록</Text>
            <View style={styles.filterRow}>
              {['현재', '전체'].map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterBtn, taskFilter === f && styles.filterBtnActive, Platform.OS === 'web' && { cursor: 'pointer' }]}
                  onPress={() => setTaskFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterBtnText, taskFilter === f && styles.filterBtnTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{displayedTasks.length}</Text>
            </View>
          </View>
          {displayedTasks.length === 0 && (
            <Text style={styles.emptyText}>해당 Task가 없습니다.</Text>
          )}
          {displayedTasks.map((task, idx) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskRow, idx < displayedTasks.length - 1 && styles.rowDivider]}
              onPress={() => onTaskPress(task)}
              activeOpacity={0.7}
            >
              <View style={styles.taskLeft}>
                <View style={[styles.statusDot, task.status === '진행중' ? styles.dotGreen : task.status === '완료' ? styles.dotBlue : task.status === '지연' ? styles.dotRed : styles.dotAmber]} />
                <View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>{task.dueDate ? `${task.dueDate}` : ''} 마감 예정</Text>
                </View>
              </View>
              <View style={[styles.pill, task.status === '진행중' ? styles.pillGreen : task.status === '완료' ? styles.pillBlue : task.status === '지연' ? styles.pillRed : styles.pillAmber]}>
                <Text style={[styles.pillText, task.status === '진행중' ? styles.pillTextGreen : task.status === '완료' ? styles.pillTextBlue : task.status === '지연' ? styles.pillTextRed : styles.pillTextAmber]}>
                  {task.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Task별 진척률</Text>
          </View>
          {catTasks.length === 0 && (
            <Text style={styles.emptyText}>해당 Task가 없습니다.</Text>
          )}
          {catTasks.map((task, idx) => (
            <View key={task.id} style={idx < catTasks.length - 1 ? styles.progressItemGap : null}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>{task.title}</Text>
                <Text style={styles.progressPercent}>{calcTaskProgress(task)}%</Text>
              </View>
              <View style={styles.trackBg}>
                <View style={[styles.trackFill, { width: `${calcTaskProgress(task)}%`, backgroundColor: PROGRESS_COLORS[idx % PROGRESS_COLORS.length] }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>완료 Task 목록</Text>
          </View>
          {pastTasksList.length === 0 && (
            <Text style={styles.emptyText}>완료된 Task가 없습니다.</Text>
          )}
          {pastTasksList.map((task, idx) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.pastRow, idx < pastTasksList.length - 1 && styles.rowDivider]}
              onPress={() => onTaskPress(task)}
              activeOpacity={0.7}
            >
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <View style={styles.pastInfo}>
                <Text style={styles.pastTitle}>{task.title}</Text>
                <Text style={styles.taskMeta}>{task.doneAt} 완료</Text>
              </View>
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{task.category}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const calcTaskProgress = (task) => {
  if (task.subTasks && task.subTasks.length > 0) {
    return Math.round(task.subTasks.reduce((sum, st) => sum + (st.progress || 0), 0) / task.subTasks.length);
  }
  return task.progress ?? 0;
};

const DEFAULT_TASKS = [
  { id: 1, title: '앱 UI 디자인', status: '진행중', dueDate: '2026-05-03', registeredAt: '2026-04-28', notes: '', progress: 75, category: '업무' },
  { id: 2, title: '마케팅 기획서 작성', status: '진행중', dueDate: '2026-05-05', registeredAt: '2026-04-29', notes: '', progress: 40, category: '업무' },
  { id: 3, title: '서버 API 연동', status: '대기', dueDate: '2026-05-10', registeredAt: '2026-04-30', notes: '', progress: 10, category: '업무' },
];

function NameInputScreen({ onSubmit }) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <SafeAreaView style={ns.safeArea}>
      <StatusBar style="light" />
      <View style={ns.container}>
        <Text style={ns.emoji}>👋</Text>
        <Text style={ns.title}>안녕하세요!</Text>
        <Text style={ns.subtitle}>시작하기 전에{'\n'}이름을 알려주세요.</Text>
        <TextInput
          style={ns.input}
          value={name}
          onChangeText={setName}
          placeholder="이름을 입력하세요"
          placeholderTextColor="#4B5563"
          maxLength={20}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[ns.btn, !name.trim() && ns.btnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={ns.btnText}>시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SubTaskScreen({ task, onBack, onSave }) {
  const [subTasks, setSubTasks] = useState(task.subTasks || []);
  const [subTaskInput, setSubTaskInput] = useState('');
  const sliderWidths = useRef({});

  const addSubTask = () => {
    if (!subTaskInput.trim()) return;
    setSubTasks(prev => [...prev, { id: Date.now(), title: subTaskInput.trim(), done: false, progress: 0 }]);
    setSubTaskInput('');
  };

  const toggleSubTask = (id) => {
    setSubTasks(prev => prev.map(st => st.id === id ? { ...st, done: !st.done } : st));
  };

  const deleteSubTask = (id) => {
    setSubTasks(prev => prev.filter(st => st.id !== id));
  };

  const updateSubTaskProgress = (id, progress) => {
    setSubTasks(prev => prev.map(st => st.id === id ? { ...st, progress } : st));
  };

  const handleSliderMove = (id, locationX) => {
    const width = sliderWidths.current[id] || 1;
    const pct = Math.max(0, Math.min(100, Math.round((locationX / width) * 100)));
    updateSubTaskProgress(id, pct);
  };

  const handleSave = () => {
    onSave(task.id, { subTasks });
    onBack();
  };

  const doneCount = subTasks.filter(st => st.done).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.75} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { flex: 1 }]}>세부 Task</Text>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.detailTitleText} numberOfLines={2}>{task.title}</Text>
          <Text style={[styles.taskMeta, { marginTop: 4, marginBottom: 16 }]}>
            {doneCount}/{subTasks.length} 완료
          </Text>
          {subTasks.length === 0 && (
            <Text style={styles.emptyText}>세부 Task가 없습니다.</Text>
          )}
          {subTasks.map(st => (
            <View key={st.id} style={[sub.itemWrap, { marginBottom: 4 }]}>
              <View style={sub.row}>
                <TouchableOpacity onPress={() => toggleSubTask(st.id)} activeOpacity={0.7} style={[sub.check, st.done && sub.checkDone]}>
                  <Text style={sub.checkText}>{st.done ? '✓' : ''}</Text>
                </TouchableOpacity>
                <Text style={[sub.itemTitle, st.done && sub.itemTitleDone]} numberOfLines={2}>{st.title}</Text>
                <TouchableOpacity onPress={() => deleteSubTask(st.id)} activeOpacity={0.7} style={sub.del}>
                  <Text style={sub.delText}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={sub.progressRow}>
                <View style={sub.progressBarBg}>
                  <View style={[sub.progressBarFill, { width: `${st.progress || 0}%` }]} />
                </View>
                <Text style={sub.progressPct}>{st.progress || 0}%</Text>
              </View>
              <View style={sub.sliderRow}>
                <View
                  style={sub.sliderTrack}
                  onLayout={(e) => { sliderWidths.current[st.id] = e.nativeEvent.layout.width; }}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={(e) => handleSliderMove(st.id, e.nativeEvent.locationX)}
                  onResponderMove={(e) => handleSliderMove(st.id, e.nativeEvent.locationX)}
                >
                  <View style={sub.sliderTrackBg} />
                  <View style={[sub.sliderFill, { width: `${st.progress || 0}%` }]} />
                  <View style={[sub.sliderThumb, { left: `${st.progress || 0}%` }]} />
                </View>
              </View>
            </View>
          ))}
          <View style={[sub.addRow, { marginTop: 12 }]}>
            <TextInput
              style={sub.input}
              value={subTaskInput}
              onChangeText={setSubTaskInput}
              placeholder="세부 Task 입력"
              placeholderTextColor="#4B5563"
              returnKeyType="done"
              onSubmitEditing={addSubTask}
            />
            <TouchableOpacity style={sub.addBtn} onPress={addSubTask} activeOpacity={0.8}>
              <Text style={sub.addBtnText}>추가</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.detailBtnRow, { paddingHorizontal: 16, paddingBottom: 16 }]}>
        <TouchableOpacity
          style={[styles.detailBtn, styles.detailSaveBtn, { flex: 1 }]}
          onPress={handleSave}
          activeOpacity={0.82}
        >
          <Text style={styles.detailBtnText}>저장</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [taskFilter, setTaskFilter] = useState('현재');
  const [loaded, setLoaded] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [returnScreen, setReturnScreen] = useState('home');

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('tasks'),
      AsyncStorage.getItem('nextId'),
      AsyncStorage.getItem('userName'),
    ]).then(([savedTasks, savedNextId, savedUserName]) => {
      setTasks(savedTasks ? JSON.parse(savedTasks) : DEFAULT_TASKS);
      setNextId(savedNextId ? JSON.parse(savedNextId) : 7);
      setUserName(savedUserName || '');
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem('nextId', JSON.stringify(nextId));
  }, [nextId, loaded]);

  useEffect(() => {
    if (!loaded || !userName) return;
    AsyncStorage.setItem('userName', userName);
  }, [userName, loaded]);

  /* useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: '알림',
          importance: Notifications.AndroidImportance.MAX,
        });
      }
      await Notifications.requestPermissionsAsync();
    })();
  }, []); */

  useEffect(() => {
    if (!loaded) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    setTasks(prev => {
      const hasOverdue = prev.some(t =>
        (t.status === '진행중' || t.status === '대기') &&
        t.dueDate &&
        parseDueDate(t.dueDate) < todayStart
      );
      if (!hasOverdue) return prev;
      return prev.map(t =>
        (t.status === '진행중' || t.status === '대기') &&
        t.dueDate &&
        parseDueDate(t.dueDate) < todayStart
          ? { ...t, status: '지연' }
          : t
      );
    });
  }, [loaded]);

  const handleUpdateTask = (id, updates) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const merged = { ...t, ...updates };
      if (merged.dueDate) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const due = parseDueDate(merged.dueDate);
        if (due < todayStart && merged.status !== '완료') {
          merged.status = '지연';
        } else if (due >= todayStart && t.status === '지연' && updates.status === '지연') {
          merged.status = '진행중';
        }
      }
      return merged;
    }));
  };

  const handleDeleteTask = (id) => {
    const target = tasks.find(t => t.id === id);
    // if (target?.notifId) {
    //   Notifications.cancelScheduledNotificationAsync(target.notifId).catch(() => {});
    // }
    setTasks(prev => prev.filter(t => t.id !== id));
    setScreen('home');
  };

  const handleAddTask = async (taskData) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    let notifId = null;
    /* if (taskData.notifEnabled && taskData.dueDate) {
      const due = parseDueDate(taskData.dueDate);
      const trigger = new Date(due);
      trigger.setDate(trigger.getDate() - (taskData.notifOffset ?? 0));
      trigger.setHours(taskData.notifHour ?? 9, 0, 0, 0);
      if (trigger > new Date()) {
        notifId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Task 마감 알림',
            body: `"${taskData.title}" ${taskData.notifOffset > 0 ? `마감 ${taskData.notifOffset}일 전` : '마감일'}입니다.`,
            android: { channelId: 'default' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger,
          },
        }).catch(() => null);
      }
    } */
    setTasks(prev => [...prev, { id: nextId, registeredAt: `${yyyy}-${mm}-${dd}`, notes: '', notifId, ...taskData }]);
    setNextId(n => n + 1);
    setAddModalVisible(false);
  };

  const today = new Date();
  const headerDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const PAST_TASKS = tasks
    .filter(t => t.status === '완료')
    .map(t => ({ id: t.id, title: t.title, doneAt: t.dueDate, category: t.category || '-' }));

  const inProgressTasks = tasks
    .filter(t => t.status === '진행중')
    .sort((a, b) => parseDueDate(a.dueDate) - parseDueDate(b.dueDate));
  const totalCompleted = PAST_TASKS.length;
  const totalAll = tasks.length;
  const avgAchievement = totalAll > 0 ? Math.round(tasks.reduce((sum, t) => sum + calcTaskProgress(t), 0) / totalAll) : 0;

  const allTasksDisplay = tasks;
  const pastTasksList = PAST_TASKS;

  const STATUS_ORDER = { '진행중': 0, '지연': 1, '대기': 2, '완료': 3 };
  const sortByStatusThenDue = (a, b) => {
    const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (so !== 0) return so;
    return parseDueDate(a.dueDate) - parseDueDate(b.dueDate);
  };

  const displayedTasks = taskFilter === '전체'
    ? [...tasks].sort(sortByStatusThenDue)
    : [...tasks].filter(t => t.status !== '완료').sort(sortByStatusThenDue);

  const handleTaskPress = (task, from = 'home') => {
    setSelectedTaskId(task.id);
    setReturnScreen(from);
    setScreen('taskdetail');
  };

  const handleCategoryPress = (category, from = 'home') => {
    setSelectedCategory(category);
    setReturnScreen(from);
    setScreen('categorydetail');
  };

  if (loaded && !userName) {
    return <NameInputScreen onSubmit={setUserName} />;
  }

  if (screen === 'inprogress') {
    return (
      <InProgressScreen
        onBack={() => setScreen('home')}
        tasks={inProgressTasks}
        onUpdateTask={handleUpdateTask}
      />
    );
  }

  if (screen === 'categorymanage') {
    return (
      <CategoryManageScreen
        tasks={tasks}
        onBack={() => setScreen('home')}
        onCategoryPress={(cat) => handleCategoryPress(cat, 'categorymanage')}
      />
    );
  }

  if (screen === 'categorydetail') {
    return (
      <CategoryDetailScreen
        category={selectedCategory}
        tasks={tasks}
        onBack={() => setScreen(returnScreen)}
        onTaskPress={(task) => handleTaskPress(task, 'categorydetail')}
      />
    );
  }

  if (screen === 'taskdetail') {
    const selectedTask = allTasksDisplay.find(t => t.id === selectedTaskId);
    const isPast = false;
    return (
      <TaskDetailScreen
        key={selectedTaskId}
        task={selectedTask}
        isPast={isPast}
        onBack={() => setScreen(returnScreen)}
        onSave={(id, updates) => {
          handleUpdateTask(id, updates);
          setScreen(returnScreen);
        }}
        onDelete={handleDeleteTask}
        onNavigateSubTasks={() => setScreen('subtask')}
      />
    );
  }

  if (screen === 'subtask') {
    const selectedTask = allTasksDisplay.find(t => t.id === selectedTaskId);
    return (
      <SubTaskScreen
        key={selectedTaskId}
        task={selectedTask}
        onBack={() => setScreen('taskdetail')}
        onSave={(id, updates) => handleUpdateTask(id, updates)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerGreeting}>👋 안녕하세요, {userName}님! 👋</Text>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{userName}의 Task 관리</Text>
            <TouchableOpacity
              style={styles.addTaskBtn}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addTaskBtnText}>New Task</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerDate}>{headerDate}</Text>
        </View>

        {/* ── Summary Stats ── */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard2}
            activeOpacity={0.75}
            onPress={() => setScreen('inprogress')}
          >
            <Text style={styles.statValue}>{inProgressTasks.length}</Text>
            <Text style={styles.statLabel2}>진행중</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={[styles.statValue, styles.statValueLight]}>{avgAchievement}%</Text>
            <Text style={[styles.statLabel, styles.statLabelLight]}>평균 달성률</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCompleted}</Text>
            <Text style={styles.statLabel}>완료됨</Text>
          </View>
        </View>

        {/* ── Card 1 : Task 목록 ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Task 목록</Text>
            <View style={styles.filterRow}>
              {['현재', '전체'].map(f => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterBtn,
                    taskFilter === f && styles.filterBtnActive,
                    Platform.OS === 'web' && { cursor: 'pointer' },
                  ]}
                  onPress={() => setTaskFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterBtnText, taskFilter === f && styles.filterBtnTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{displayedTasks.length}</Text>
            </View>
          </View>

          {displayedTasks.map((task, idx) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskRow, idx < displayedTasks.length - 1 && styles.rowDivider]}
              onPress={() => handleTaskPress(task)}
              activeOpacity={0.7}
            >
              <View style={styles.taskLeft}>
                <View
                  style={[
                    styles.statusDot,
                    task.status === '진행중' ? styles.dotGreen
                    : task.status === '완료' ? styles.dotBlue
                    : task.status === '지연' ? styles.dotRed
                    : styles.dotAmber,
                  ]}
                />
                <View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>{task.category ? `${task.category} · ` : ''}{task.dueDate ? `${task.dueDate}` : '' } 마감 예정</Text>
                </View>
              </View>
              <View
                style={[
                  styles.pill,
                  task.status === '진행중' ? styles.pillGreen
                  : task.status === '완료' ? styles.pillBlue
                  : task.status === '지연' ? styles.pillRed
                  : styles.pillAmber,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    task.status === '진행중' ? styles.pillTextGreen
                    : task.status === '완료' ? styles.pillTextBlue
                    : task.status === '지연' ? styles.pillTextRed
                    : styles.pillTextAmber,
                  ]}
                >
                  {task.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Card 2 : Task별 진척률 ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Task별 진척률</Text>
          </View>

          {tasks.map((task, idx) => (
            <View
              key={task.id}
              style={idx < tasks.length - 1 ? styles.progressItemGap : null}
            >
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>{task.title}</Text>
                <Text style={styles.progressPercent}>{calcTaskProgress(task)}%</Text>
              </View>
              <View style={styles.trackBg}>
                <View
                  style={[
                    styles.trackFill,
                    { width: `${calcTaskProgress(task)}%`, backgroundColor: PROGRESS_COLORS[idx % PROGRESS_COLORS.length] },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
		
		{/* ── 카테고리 별 task 관리 버튼 ── */}
        <TouchableOpacity
          style={[styles.detailBtn, { marginHorizontal: 24, marginTop: 8, marginBottom: 8 }]}
          onPress={() => setScreen('categorymanage')}
          activeOpacity={0.82}
        >
          <Text style={styles.detailBtnText}>카테고리 별 task 관리</Text>
          <Text style={styles.detailBtnArrow}>→</Text>
        </TouchableOpacity>
		
        {/* ── Card 3 : 지난 Task 목록 ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>완료 Task 목록</Text>
          </View>

          {pastTasksList.map((task, idx) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.pastRow, idx < pastTasksList.length - 1 && styles.rowDivider]}
              onPress={() => handleTaskPress(task)}
              activeOpacity={0.7}
            >
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <View style={styles.pastInfo}>
                <Text style={styles.pastTitle}>{task.title}</Text>
                <Text style={styles.taskMeta}>{task.doneAt} 완료</Text>
              </View>
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{task.category}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      <AddTaskModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddTask}
      />
    </SafeAreaView>
  );
}

const CARD_BG = '#141720';
const BORDER = '#1F2435';
const ACCENT = '#5B6CF8';
const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0D14',
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#0B0D14',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Screen header (InProgressScreen / TaskDetailScreen)
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backBtnText: {
    fontSize: 15,
    color: '#5B6CF8',
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  headerGreeting: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    flex: 1,
  },
  addTaskBtn: {
    backgroundColor: '#FCFC88',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addTaskBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5b6cf8',
  },
  headerDate: {
    fontSize: 12,
    color: '#374151',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  statCard2: {
    flex: 1,
	backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  statCardAccent: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statValue2: {
	backgroundColor: '#22C55E',
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statValueLight: {
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  statLabel2: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statLabelLight: {
    color: 'rgba(255,255,255,0.75)',
  },

  // Card
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Task row
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: { backgroundColor: '#22C55E' },
  dotAmber: { backgroundColor: '#F59E0B' },
  dotBlue: { backgroundColor: '#5B6CF8' },
  dotRed: { backgroundColor: '#EF4444' },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    marginBottom: 2,
  },
  taskMeta: {
    fontSize: 11,
    color: '#4B5563',
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillGreen: { backgroundColor: 'rgba(34,197,94,0.13)' },
  pillAmber: { backgroundColor: 'rgba(245,158,11,0.13)' },
  pillBlue: { backgroundColor: 'rgba(91,108,248,0.13)' },
  pillRed: { backgroundColor: 'rgba(239,68,68,0.13)' },
  pillText: { fontSize: 12, fontWeight: '600' },
  pillTextGreen: { color: '#22C55E' },
  pillTextAmber: { color: '#F59E0B' },
  pillTextBlue: { color: '#5B6CF8' },
  pillTextRed: { color: '#EF4444' },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginRight: 8,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#1F2435',
    borderWidth: 1,
    borderColor: '#2A2F45',
  },
  filterBtnActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  filterBtnText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
  },

  // Empty state
  emptyText: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Progress
  progressItemGap: { marginBottom: 16 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  trackBg: {
    height: 6,
    backgroundColor: '#1F2435',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Past tasks
  pastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(91,108,248,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '700',
  },
  pastInfo: { flex: 1 },
  pastTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  categoryChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#1F2435',
  },
  categoryText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Detail button (홈 하단 / TaskDetailScreen 저장 버튼 공용)
  detailBtnRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 8,
    gap: 10,
  },
  detailBtn: {
    flex: 1,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  detailDeleteBtn: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  detailSaveBtn: {
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
  },
  detailBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  detailBtnArrow: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },

  // TaskDetailScreen
  detailTitleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 20,
  },
  detailTitleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: -0.3,
  },
  detailFieldBlock: {
    paddingVertical: 14,
  },
  detailFieldLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  detailFieldValue: {
    fontSize: 15,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  detailFieldValueMuted: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  detailInput: {
    marginBottom: 0,
  },
  detailNotesInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  progressInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressAdjBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1F2435',
    borderWidth: 1,
    borderColor: '#2A2F45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressAdjBtnText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 24,
  },
  progressInputValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 52,
    textAlign: 'center',
  },
});

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: '85%',
    backgroundColor: '#141720',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2435',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1F2435',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A2F45',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  datePickerPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
  },
  datePickerIcon: {
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 22,
  },
  categoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1F2435',
    borderWidth: 1,
    borderColor: '#2A2F45',
  },
  categoryBtnActive: {
    backgroundColor: '#5B6CF8',
    borderColor: '#5B6CF8',
  },
  categoryBtnText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  categoryBtnTextActive: {
    color: '#FFFFFF',
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#1F2435',
    borderWidth: 1,
    borderColor: '#2A2F45',
  },
  statusBtnActive: {
    backgroundColor: '#5B6CF8',
    borderColor: '#5B6CF8',
  },
  statusBtnText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1F2435',
  },
  cancelText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#5B6CF8',
  },
  saveText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

const sc = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
  },
  previewLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#141720',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2435',
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    backgroundColor: '#5B6CF8',
  },
  cardBody: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    flexShrink: 0,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#1F2435',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBlock: {
    paddingVertical: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressPct: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  trackBg: {
    height: 6,
    backgroundColor: '#1F2435',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#5B6CF8',
  },
  notesBlock: {
    paddingVertical: 12,
  },
  notesText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 18,
  },
  footer: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'right',
    padding: 12,
    paddingTop: 0,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#1F2435',
  },
  cancelText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  shareBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#5B6CF8',
    shadowColor: '#5B6CF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  shareBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

const ns = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0D14',
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  input: {
    width: '100%',
    backgroundColor: '#1F2435',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2F45',
    marginBottom: 16,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    backgroundColor: '#5B6CF8',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

const sub = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 10,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#2A2F45',
    backgroundColor: '#1F2435',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: 'rgba(91,108,248,0.2)',
    borderColor: '#5B6CF8',
  },
  checkText: {
    fontSize: 12,
    color: '#5B6CF8',
    fontWeight: '700',
  },
  itemTitle: {
    flex: 1,
    fontSize: 13,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  itemTitleDone: {
    color: '#4B5563',
    textDecorationLine: 'line-through',
  },
  del: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '300',
    lineHeight: 24,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1F2435',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#2A2F45',
  },
  addBtn: {
    backgroundColor: '#5B6CF8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  itemWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#1F2435',
    paddingBottom: 10,
    marginBottom: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 32,
    gap: 8,
    marginTop: 5,
    marginBottom: 5,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#1F2435',
    borderRadius: 2,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#5B6CF8',
    borderRadius: 2,
  },
  progressPct: {
    fontSize: 11,
    color: '#6B7280',
    width: 30,
    textAlign: 'right',
  },
  sliderRow: {
    marginLeft: 32,
    marginRight: 4,
    marginBottom: 6,
    marginTop: 2,
  },
  sliderTrack: {
    height: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    height: 4,
    backgroundColor: '#1F2435',
    borderRadius: 2,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 8,
    height: 4,
    backgroundColor: '#5B6CF8',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5B6CF8',
    marginLeft: -6,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
