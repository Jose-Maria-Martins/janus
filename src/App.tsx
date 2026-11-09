import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Shell } from './components/Shell';
import { useStore } from './data/store';
import { HomeScreen } from './screens/home/HomeScreen';
import { ImportScreen } from './screens/import/ImportScreen';
import { Placeholder } from './screens/Placeholder';
import { AskScreen } from './screens/ask/AskScreen';
import { BuyFlow } from './screens/buy/BuyFlow';
import { BuyScreen } from './screens/buy/BuyScreen';
import { ClaimDetailScreen } from './screens/claims/ClaimDetailScreen';
import { ClaimsScreen } from './screens/claims/ClaimsScreen';
import { ReportFlow } from './screens/claims/ReportFlow';
import { OnboardingFlow } from './screens/onboarding/OnboardingFlow';
import { PoliciesScreen } from './screens/policies/PoliciesScreen';
import { PolicyDetailScreen } from './screens/policies/PolicyDetailScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="welcome" element={<OnboardingFlow />} />
        <Route element={<Shell />}>
          <Route index element={<FirstVisit />} />
          <Route path="policies" element={<PoliciesScreen />} />
          <Route path="policies/:id" element={<PolicyDetailScreen />} />
          <Route path="import" element={<ImportScreen />} />
          <Route path="ask" element={<AskScreen />} />
          <Route path="buy" element={<BuyScreen />} />
          <Route path="buy/:mode/:id" element={<BuyFlow />} />
          <Route path="claims" element={<ClaimsScreen />} />
          <Route path="claims/new" element={<ReportFlow />} />
          <Route path="claims/:id" element={<ClaimDetailScreen />} />
          <Route path="profile" element={<Placeholder title="Profile" step={9} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

/** Home, unless this browser hasn't been through the welcome flow yet. Links to other screens open directly. */
function FirstVisit() {
  return useStore().onboarded ? <HomeScreen /> : <Navigate to="/welcome" replace />;
}
