import React, { useRef, useState } from 'react';
import { Pressable, SafeAreaView, TextInput, View, Text, ActivityIndicator, RefreshControl  } from 'react-native';
import {
  ScrollView,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import ListItem from '../../components/ListItems';
import TeamRequestItem from '@/components/TeamRequest';
import {notificationStyles as styles} from "@/styles/Notification.styles"
import { Event as TaskInterface, TeamRequest  } from '@/types/model';
import { useRequestsData } from '@/hooks/useRequestsData';
import {handleEventResponse, handleTeamRequestResponse} from '@/utils/Requestes/requestHelpers'


function Requestes() {
  const [activeTab, setActiveTab] = useState<'event' | 'team'>('event');
  const [search, setSearch] = useState<string>("");  
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef(null);

  const { loading, eventTasks, teamRequests, reload } = useRequestsData(activeTab);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload(); // call the hook’s reload function
    setRefreshing(false);
  };

  const isEventTab = activeTab === 'event';
  const filteredEventTasks = eventTasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase()) ||
    task.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTeamRequests = teamRequests.filter((request) => {
  const searchText = search.toLowerCase();

  const branchName = request.branch?.branch_name?.toLowerCase() || "";
  const senderName = request.sender?.name?.toLowerCase() || "";
  const senderEmail = request.sender?.email?.toLowerCase() || "";
  const senderPhone = request.sender?.phone || "";

  return (
    branchName.includes(searchText) ||
    senderName.includes(searchText) ||
    senderEmail.includes(searchText) ||
    senderPhone.includes(searchText)
  );
});


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, isEventTab && styles.activeTab]}
          onPress={() => setActiveTab('event')}
        >
          <Text style={[styles.tabText, isEventTab && styles.activeTabText]}>
            Event Requests
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, !isEventTab && styles.activeTab]}
          onPress={() => setActiveTab('team')}
        >
          <Text style={[styles.tabText, !isEventTab && styles.activeTabText]}>
            Team Requests
          </Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <TextInput
          placeholder="Search requests..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#090040" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          ref={scrollRef}
          style={{ flex: 1 , marginBottom: 100}}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {isEventTab ? (
            filteredEventTasks.length > 0 ? (
              filteredEventTasks.map((task, index) => (
                <ListItem
                  key={`${index}`}
                  task={task}
                  onDismiss={() => handleEventResponse('rejected', task)}
                  onComplete={() => handleEventResponse('accepted', task)}
                />
              ))
            ) : (
              <Text style={{ textAlign: "center", marginTop: 20, fontSize : 15, color : "#666" }}>No Requests Found</Text>
            )
          ) : (
            filteredTeamRequests.length > 0 ? (
              filteredTeamRequests.map((request, index) => (
                <TeamRequestItem
                  key={`${index}`}
                  request={request}
                  onDismiss={() => handleTeamRequestResponse("rejected", request)}
                  onComplete={() => handleTeamRequestResponse("accepted", request)}
                />
              ))
            ) : (
              <Text style={{ textAlign: "center", marginTop: 20, fontSize : 15, color : "#666" }}>No Requests Found</Text>
            )
          )}
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

export default () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Requestes />
    </GestureHandlerRootView>
  );
};

export { TaskInterface, TeamRequest };
