import API from "./axios";

export const getEvents = async (options = {}) => {
  const params = new URLSearchParams();
  if (options.activeOnly) params.append('activeOnly', 'true');
  
  const { data } = await API.get(`/events?${params.toString()}`);
  return data;
};

export const getEventBySlug = async (slug) => {
  const { data } = await API.get(`/events/${slug}`);
  return data;
};

export const createEvent = async (eventData) => {
  const { data } = await API.post("/events", eventData);
  return data;
};

export const updateEvent = async (id, eventData) => {
  const { data } = await API.put(`/events/${id}`, eventData);
  return data;
};

export const deleteEvent = async (id) => {
  const { data } = await API.delete(`/events/${id}`);
  return data;
};

export const toggleEventStatus = async (id) => {
  const { data } = await API.patch(`/events/${id}/status`);
  return data;
};
