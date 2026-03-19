const FITBIT_API_BASE = 'https://api.fitbit.com';

export interface FitbitTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  user_id: string;
}

export interface FitbitHeartRate {
  dateTime: string;
  value: {
    restingHeartRate?: number;
    heartRateZones: Array<{
      name: string;
      min: number;
      max: number;
      minutes: number;
      caloriesOut: number;
    }>;
  };
}

export interface FitbitSleepLog {
  dateOfSleep: string;
  duration: number;
  efficiency: number;
  startTime: string;
  endTime: string;
  minutesAsleep: number;
  minutesAwake: number;
  levels?: {
    summary: {
      deep?: { count: number; minutes: number };
      light?: { count: number; minutes: number };
      rem?: { count: number; minutes: number };
      wake?: { count: number; minutes: number };
    };
  };
}

export interface FitbitSteps {
  dateTime: string;
  value: string;
}

export interface FitbitDailySummary {
  date: string;
  steps: number;
  restingHeartRate: number | null;
  heartRateZones: FitbitHeartRate['value']['heartRateZones'];
  sleep: {
    duration: number;
    efficiency: number;
    minutesAsleep: number;
    minutesAwake: number;
    deepMinutes: number;
    lightMinutes: number;
    remMinutes: number;
  } | null;
  calories: number;
  activeMinutes: number;
}

const FITBIT_SCOPES = 'activity heartrate sleep profile';

export function getFitbitAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_FITBIT_CLIENT_ID;
  const redirectUri = `${window.location.origin}/api/auth/fitbit/callback`;

  const scope = encodeURIComponent(FITBIT_SCOPES);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId!,
    redirect_uri: redirectUri,
    expires_in: '604800',
  });

  return `https://www.fitbit.com/oauth2/authorize?${params.toString()}&scope=${scope}`;
}

export async function fetchFitbitData(endpoint: string, accessToken: string): Promise<any> {
  const response = await fetch(`${FITBIT_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (response.status === 401) {
    throw new Error('FITBIT_TOKEN_EXPIRED');
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Fitbit API error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function getFitbitProfile(accessToken: string) {
  const data = await fetchFitbitData('/1/user/-/profile.json', accessToken);
  return data.user;
}

export async function getFitbitStepsToday(accessToken: string): Promise<number> {
  const data = await fetchFitbitData('/1/user/-/activities/steps/date/today/1d.json', accessToken);
  const steps = data['activities-steps']?.[0]?.value;
  return parseInt(steps || '0', 10);
}

export async function getFitbitHeartRateToday(accessToken: string): Promise<FitbitHeartRate | null> {
  const data = await fetchFitbitData('/1/user/-/activities/heart/date/today/1d.json', accessToken);
  return data['activities-heart']?.[0] || null;
}

export async function getFitbitSleepToday(accessToken: string): Promise<FitbitSleepLog | null> {
  const data = await fetchFitbitData('/1.2/user/-/sleep/date/today.json', accessToken);
  return data.sleep?.[0] || null;
}

export async function getFitbitActivityToday(accessToken: string) {
  const data = await fetchFitbitData('/1/user/-/activities/date/today.json', accessToken);
  return data.summary;
}

export async function getFitbitDailySummary(accessToken: string): Promise<FitbitDailySummary> {
  const [steps, heartRate, sleep, activity] = await Promise.allSettled([
    getFitbitStepsToday(accessToken),
    getFitbitHeartRateToday(accessToken),
    getFitbitSleepToday(accessToken),
    getFitbitActivityToday(accessToken),
  ]);

  const stepsValue = steps.status === 'fulfilled' ? steps.value : 0;
  const hrValue = heartRate.status === 'fulfilled' ? heartRate.value : null;
  const sleepValue = sleep.status === 'fulfilled' ? sleep.value : null;
  const activityValue = activity.status === 'fulfilled' ? activity.value : null;

  return {
    date: new Date().toISOString().split('T')[0],
    steps: stepsValue,
    restingHeartRate: hrValue?.value?.restingHeartRate ?? null,
    heartRateZones: hrValue?.value?.heartRateZones ?? [],
    sleep: sleepValue
      ? {
          duration: sleepValue.duration,
          efficiency: sleepValue.efficiency,
          minutesAsleep: sleepValue.minutesAsleep,
          minutesAwake: sleepValue.minutesAwake,
          deepMinutes: sleepValue.levels?.summary?.deep?.minutes ?? 0,
          lightMinutes: sleepValue.levels?.summary?.light?.minutes ?? 0,
          remMinutes: sleepValue.levels?.summary?.rem?.minutes ?? 0,
        }
      : null,
    calories: activityValue?.caloriesOut ?? 0,
    activeMinutes:
      (activityValue?.fairlyActiveMinutes ?? 0) +
      (activityValue?.veryActiveMinutes ?? 0),
  };
}
