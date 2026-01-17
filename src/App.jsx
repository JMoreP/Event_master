import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Projects from './components/Projects';
import Panel from './components/Panel';
import MainLayout from './components/MainLayout';
import CreateTask from './components/CreateTask';
import Calendar from './components/Calendar';
import Tasks from './components/Tasks';
import CreateProject from './components/CreateProject';
import EventList from './components/EventList';
import EventDetail from './components/EventDetail';
import ProjectDetail from './components/ProjectDetail';
import CreateEvent from './components/CreateEvent';
import Speakers from './components/Speakers';
import CreateSpeaker from './components/CreateSpeaker';
import MyEvents from './components/MyEvents';
import GiftsInventory from './components/GiftsInventory';
import MyGifts from './components/MyGifts';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { EventProvider } from './context/EventContext';
import { SpeakerProvider } from './context/SpeakerContext';
import { GiftProvider } from './context/GiftContext';
import { ProjectProvider } from './context/ProjectContext';
import { TaskProvider } from './context/TaskContext';
import { ToastProvider } from './context/ToastContext';
import Profile from './components/Profile';
import TeamManagement from './components/TeamManagement';
import Reports from './components/Reports';

function App() {

  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <EventProvider>
            <SpeakerProvider>
              <GiftProvider>
                <ProjectProvider>
                  <TaskProvider>
                    <BrowserRouter>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route element={<MainLayout />}>
                          <Route path="/events" element={<EventList />} />
                          <Route path="/events/:id" element={<EventDetail />} />
                        </Route>

                        {/* Rutas Protegidas (Requieren Login) */}
                        <Route element={<ProtectedRoute />}>
                          <Route element={<MainLayout />}>
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/projects/:id" element={<ProjectDetail />} />
                            <Route path="/projects/:projectId/tasks/create" element={<CreateTask />} />
                            <Route path="/events/my-events" element={<MyEvents />} />
                            <Route path="/my-gifts" element={<MyGifts />} />
                            <Route path="/panel" element={<Panel />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings" element={<Profile />} />
                            <Route path="/tasks" element={<Tasks />} />
                            <Route path="/speakers" element={<Speakers />} />
                            <Route path="/tasks/create" element={<CreateTask />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route path="/reports" element={<Reports />} />

                            {/* Rutas exclusivas de Admin y Organizadores */}
                            <Route element={<ProtectedRoute allowedRoles={['admin', 'organizer', 'owner']} />}>
                              <Route path="/events/create" element={<CreateEvent />} />
                              <Route path="/events/edit/:id" element={<CreateEvent />} />
                              <Route path="/projects/create" element={<CreateProject />} />
                              <Route path="/projects/edit/:id" element={<CreateProject />} />
                              <Route path="/speakers/create" element={<CreateSpeaker />} />
                              <Route path="/gifts" element={<GiftsInventory />} />
                              <Route path="/team" element={<TeamManagement />} />
                            </Route>
                          </Route>
                        </Route>
                      </Routes>
                    </BrowserRouter>
                  </TaskProvider>
                </ProjectProvider>
              </GiftProvider>
            </SpeakerProvider>
          </EventProvider>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
