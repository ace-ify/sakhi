"use client";

import { useState, useEffect } from "react";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  instructions: string;
  taken: boolean;
  takenAt?: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  status: "UPCOMING" | "COMPLETED" | "RESCHEDULED";
}

const DEFAULT_MEDS: Medication[] = [
  {
    id: "1",
    name: "Telmisartan",
    dosage: "40mg",
    time: "09:00 AM",
    instructions: "पानी के साथ नाश्ते के बाद (BP Control)",
    taken: true,
    takenAt: "09:12 AM",
  },
  {
    id: "2",
    name: "Metformin",
    dosage: "500mg",
    time: "01:30 PM",
    instructions: "दोपहर के भोजन के बाद (Sugar)",
    taken: false,
  },
  {
    id: "3",
    name: "Calcium D3",
    dosage: "500mg",
    time: "09:00 PM",
    instructions: "रात को सोने से पहले गुनगुने दूध के साथ",
    taken: false,
  },
];

const DEFAULT_APPTS: Appointment[] = [
  {
    id: "1",
    doctorName: "डॉ. अरविंद शर्मा",
    specialty: "Cardiologist (हृदय रोग विशेषज्ञ)",
    hospital: "मैक्स सुपर स्पेशियलिटी अस्पताल, साकेत",
    date: "कल (सोमवार)",
    time: "10:30 AM",
    status: "UPCOMING",
  },
  {
    id: "2",
    doctorName: "डॉ. मीनाक्षी अय्यर",
    specialty: "Ophthalmologist (नेत्र विशेषज्ञ)",
    hospital: "अपोलो क्लिनिक",
    date: "18 नवम्बर",
    time: "04:00 PM",
    status: "UPCOMING",
  },
];

const MEDS_KEY = "sakhi_medications_v1";
const APPTS_KEY = "sakhi_appointments_v1";

export function useSharedHealthData() {
  const [meds, setMeds] = useState<Medication[]>(DEFAULT_MEDS);
  const [appts, setAppts] = useState<Appointment[]>(DEFAULT_APPTS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedMeds = localStorage.getItem(MEDS_KEY);
      if (savedMeds) setMeds(JSON.parse(savedMeds));

      const savedAppts = localStorage.getItem(APPTS_KEY);
      if (savedAppts) setAppts(JSON.parse(savedAppts));
    } catch {
      // Fallback to defaults if parse fails
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveMeds = (newMeds: Medication[]) => {
    setMeds(newMeds);
    try {
      localStorage.setItem(MEDS_KEY, JSON.stringify(newMeds));
    } catch {}
  };

  const saveAppts = (newAppts: Appointment[]) => {
    setAppts(newAppts);
    try {
      localStorage.setItem(APPTS_KEY, JSON.stringify(newAppts));
    } catch {}
  };

  const markDose = (id: string, taken: boolean) => {
    const updated = meds.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          taken,
          takenAt: taken
            ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : undefined,
        };
      }
      return m;
    });
    saveMeds(updated);
  };

  const addMedication = (med: Omit<Medication, "id" | "taken">) => {
    const newMed: Medication = {
      ...med,
      id: Date.now().toString(),
      taken: false,
    };
    saveMeds([...meds, newMed]);
  };

  const addAppointment = (appt: Omit<Appointment, "id" | "status">) => {
    const newAppt: Appointment = {
      ...appt,
      id: Date.now().toString(),
      status: "UPCOMING",
    };
    saveAppts([...appts, newAppt]);
  };

  const takenCount = meds.filter((m) => m.taken).length;
  const adherencePct = meds.length > 0 ? Math.round((takenCount / meds.length) * 100) : 100;

  return {
    meds,
    appts,
    isLoaded,
    markDose,
    addMedication,
    addAppointment,
    takenCount,
    adherencePct,
  };
}
