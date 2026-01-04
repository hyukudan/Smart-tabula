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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format, isFuture, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Calendar,
  Trash2,
  Loader2,
  CalendarOff,
  UtensilsCrossed,
} from "lucide-react";
import { AbsenceReason, AbsenceReasonLabels } from "@/types";

interface Absence {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  notes: string | null;
}

interface SkipMeal {
  id: string;
  date: Date;
  meal: string;
  reason: string | null;
}

interface AbsencesViewProps {
  absences: Absence[];
  skipMeals: SkipMeal[];
}

export function AbsencesView({ absences, skipMeals }: AbsencesViewProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [skipMealDialogOpen, setSkipMealDialogOpen] = useState(false);

  // Absence form
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reason, setReason] = useState<string>("VACATION");
  const [notes, setNotes] = useState("");

  // Skip meal form
  const [skipDate, setSkipDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [skipMeal, setSkipMeal] = useState("LUNCH");
  const [skipReason, setSkipReason] = useState("");

  const handleCreateAbsence = async () => {
    if (!startDate || !endDate) {
      toast.error("Las fechas son requeridas");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("La fecha de fin debe ser posterior a la de inicio");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          reason,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear ausencia");
      }

      toast.success("Ausencia registrada correctamente");
      setAbsenceDialogOpen(false);
      setNotes("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear ausencia");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSkipMeal = async () => {
    if (!skipDate) {
      toast.error("La fecha es requerida");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/skip-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: skipDate,
          meal: skipMeal,
          reason: skipReason || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al registrar");
      }

      toast.success("Registrado correctamente");
      setSkipMealDialogOpen(false);
      setSkipReason("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAbsence = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta ausencia?")) return;

    try {
      const response = await fetch(`/api/absences/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      toast.success("Ausencia eliminada");
      router.refresh();
    } catch {
      toast.error("Error al eliminar ausencia");
    }
  };

  const handleDeleteSkipMeal = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;

    try {
      const response = await fetch(`/api/skip-meals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      toast.success("Registro eliminado");
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="absences">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="absences">Ausencias</TabsTrigger>
          <TabsTrigger value="skip-meals">Días que no como</TabsTrigger>
        </TabsList>

        <TabsContent value="absences" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">
                Registra tus vacaciones, días de baja o teletrabajo
              </p>
            </div>
            <Dialog open={absenceDialogOpen} onOpenChange={setAbsenceDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva ausencia
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar ausencia</DialogTitle>
                  <DialogDescription>
                    Indica el periodo de ausencia y el motivo
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Fecha inicio *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Fecha fin *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AbsenceReason).map(([key, value]) => (
                          <SelectItem key={key} value={value}>
                            {AbsenceReasonLabels[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Información adicional..."
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAbsenceDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateAbsence} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Registrar ausencia"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mis ausencias</CardTitle>
            </CardHeader>
            <CardContent>
              {absences.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarOff className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tienes ausencias registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {absences.map((absence) => {
                    const isPast = new Date(absence.endDate) < new Date();
                    return (
                      <div
                        key={absence.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isPast ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {format(new Date(absence.startDate), "d MMM yyyy", { locale: es })}
                              {" - "}
                              {format(new Date(absence.endDate), "d MMM yyyy", { locale: es })}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">
                                {AbsenceReasonLabels[absence.reason || "OTHER"]}
                              </Badge>
                              {absence.notes && (
                                <span className="text-sm text-muted-foreground">
                                  {absence.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {(isFuture(new Date(absence.startDate)) || isToday(new Date(absence.startDate))) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleDeleteAbsence(absence.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skip-meals" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">
                Indica días específicos que no vas a comer aquí (sin ausentarte)
              </p>
            </div>
            <Dialog open={skipMealDialogOpen} onOpenChange={setSkipMealDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo día
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Día que no como aquí</DialogTitle>
                  <DialogDescription>
                    Indica el día que no vas a utilizar el servicio de comedor
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="skipDate">Fecha *</Label>
                    <Input
                      id="skipDate"
                      type="date"
                      value={skipDate}
                      onChange={(e) => setSkipDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skipMeal">Comida</Label>
                    <Select value={skipMeal} onValueChange={setSkipMeal}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BREAKFAST">Desayuno</SelectItem>
                        <SelectItem value="LUNCH">Almuerzo</SelectItem>
                        <SelectItem value="DINNER">Cena</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skipReason">Motivo (opcional)</Label>
                    <Input
                      id="skipReason"
                      value={skipReason}
                      onChange={(e) => setSkipReason(e.target.value)}
                      placeholder="Ej: Reunión de trabajo fuera"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSkipMealDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateSkipMeal} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Registrar"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Días que no como aquí</CardTitle>
            </CardHeader>
            <CardContent>
              {skipMeals.length === 0 ? (
                <div className="text-center py-8">
                  <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tienes días registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {skipMeals.map((skip) => (
                    <div
                      key={skip.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(skip.date), "EEEE d 'de' MMMM", { locale: es })}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {skip.meal === "BREAKFAST" && "Desayuno"}
                              {skip.meal === "LUNCH" && "Almuerzo"}
                              {skip.meal === "DINNER" && "Cena"}
                            </Badge>
                            {skip.reason && (
                              <span className="text-sm text-muted-foreground">
                                {skip.reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => handleDeleteSkipMeal(skip.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
