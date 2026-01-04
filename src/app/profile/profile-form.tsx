"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, User, AlertTriangle, Leaf, Save } from "lucide-react";
import { DietaryPreference, DietaryPreferenceLabels, AllergySeverity } from "@/types";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    allergies: {
      id: string;
      allergyId: string;
      severity: string;
      allergy: {
        id: string;
        name: string;
      };
    }[];
    preferences: {
      id: string;
      type: string;
      notes: string | null;
    }[];
  };
  allAllergies: {
    id: string;
    name: string;
    description: string | null;
  }[];
}

export function ProfileForm({ user, allAllergies }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Profile data
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department || "");

  // Allergies
  const [selectedAllergies, setSelectedAllergies] = useState<
    { allergyId: string; severity: string }[]
  >(
    user.allergies.map((a) => ({
      allergyId: a.allergyId,
      severity: a.severity,
    }))
  );

  // Preferences
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(
    user.preferences.map((p) => p.type)
  );

  const handleToggleAllergy = (allergyId: string) => {
    setSelectedAllergies((prev) => {
      const exists = prev.find((a) => a.allergyId === allergyId);
      if (exists) {
        return prev.filter((a) => a.allergyId !== allergyId);
      }
      return [...prev, { allergyId, severity: "HIGH" }];
    });
  };

  const handleAllergySeverityChange = (allergyId: string, severity: string) => {
    setSelectedAllergies((prev) =>
      prev.map((a) =>
        a.allergyId === allergyId ? { ...a, severity } : a
      )
    );
  };

  const handleTogglePreference = (preference: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(preference)
        ? prev.filter((p) => p !== preference)
        : [...prev, preference]
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          department: department || null,
          allergies: selectedAllergies,
          preferences: selectedPreferences,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar perfil");
      }

      toast.success("Perfil actualizado correctamente");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información personal
          </CardTitle>
          <CardDescription>
            Actualiza tu información básica de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Ej: Desarrollo, Marketing, etc."
            />
          </div>
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alergias e intolerancias
          </CardTitle>
          <CardDescription>
            Selecciona las alergias o intolerancias que tengas. Los platos que
            las contengan serán marcados automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allAllergies.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No hay alérgenos configurados en el sistema
            </p>
          ) : (
            <div className="space-y-4">
              {allAllergies.map((allergy) => {
                const selected = selectedAllergies.find(
                  (a) => a.allergyId === allergy.id
                );
                return (
                  <div
                    key={allergy.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={!!selected}
                        onCheckedChange={() => handleToggleAllergy(allergy.id)}
                      />
                      <div>
                        <p className="font-medium">{allergy.name}</p>
                        {allergy.description && (
                          <p className="text-sm text-muted-foreground">
                            {allergy.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {selected && (
                      <Select
                        value={selected.severity}
                        onValueChange={(value) =>
                          handleAllergySeverityChange(allergy.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AllergySeverity.LOW}>
                            Leve
                          </SelectItem>
                          <SelectItem value={AllergySeverity.MEDIUM}>
                            Moderada
                          </SelectItem>
                          <SelectItem value={AllergySeverity.HIGH}>
                            Severa
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dietary preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-500" />
            Preferencias alimentarias
          </CardTitle>
          <CardDescription>
            Indica tus preferencias alimentarias para recibir recomendaciones
            personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(DietaryPreference).map(([key, value]) => {
              const isSelected = selectedPreferences.includes(value);
              return (
                <Badge
                  key={key}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer text-sm py-2 px-4"
                  onClick={() => handleTogglePreference(value)}
                >
                  {DietaryPreferenceLabels[value] || value}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isLoading} size="lg">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
