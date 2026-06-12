import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { useConfig } from "../../hooks/useConfig";

export default function App() {
  const { config, saved, setConfig, handleSave } = useConfig();

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center border border-primary bg-primary/10">
            <span className="text-xs font-bold text-primary">C</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Cronos</p>
            <p className="text-xs text-muted-foreground mt-0.5">configurações</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conexão com a API</CardTitle>
            <CardDescription>
              Configure o servidor onde os dados serão enviados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="userId">ID do Usuário</Label>
              <Input
                id="userId"
                value={config.userId}
                onChange={(e) => setConfig({ ...config, userId: e.target.value })}
                placeholder="019e66f9-..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apiUrl">URL da API</Label>
              <Input
                id="apiUrl"
                value={config.apiUrl}
                onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                placeholder="https://sua-api.com/api/time-spent"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apiToken">Token Bearer</Label>
              <Input
                id="apiToken"
                type="password"
                value={config.apiToken}
                onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                placeholder="opcional"
              />
              <p className="text-xs text-muted-foreground">
                Enviado no header Authorization da requisição.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave}>Salvar configurações</Button>
              {saved && (
                <span className="text-xs text-emerald-500">✓ salvo!</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
