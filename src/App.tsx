import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Shell } from './components/Shell';
import { HomeScreen } from './screens/home/HomeScreen';
import { ImportScreen } from './screens/import/ImportScreen';
import { Placeholder, PushPlaceholder } from './screens/Placeholder';
import { PoliciesScreen } from './screens/policies/PoliciesScreen';
import { PolicyDetailScreen } from './screens/policies/PolicyDetailScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomeScreen />} />
          <Route path="policies" element={<PoliciesScreen />} />
          <Route path="policies/:id" element={<PolicyDetailScreen />} />
          <Route path="import" element={<ImportScreen />} />
          <Route path="ask" element={<PushPlaceholder title="Ask" step={5} />} />
          <Route path="buy" element={<Placeholder title="Buy" step={6} />} />
          <Route path="claims" element={<Placeholder title="Claims" step={7} />} />
          <Route path="claims/:id" element={<PushPlaceholder title="Claim" step={7} />} />
          <Route path="profile" element={<Placeholder title="Profile" step={9} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
