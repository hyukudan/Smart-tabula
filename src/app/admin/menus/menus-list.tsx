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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Calendar,
  Send,
  Trash2,
  Edit,
  Eye,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { DishCategoryLabels } from "@/types";

interface Dish {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  tags: { id: string; tag: string }[];
  allergies: { allergy: { name: string } }[];
}

interface Menu {
  id: string;
  name: string;
  description: string | null;
  date: Date;
  isPublished: boolean;
  publishedAt: Date | null;
  dishes: {
    id: string;
    dish: Dish;
  }[];
  _count: {
    orders: number;
  };
}

interface MenusListProps {
  menus: Menu[];
  availableDishes: Dish[];
}

export function MenusList({ menus, availableDishes }: MenusListProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setSelectedDishes([]);
    setEditingMenu(null);
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setName(menu.name);
    setDescription(menu.description || "");
    setDate(format(new Date(menu.date), "yyyy-MM-dd"));
    setSelectedDishes(menu.dishes.map((d) => d.dish.id));
    setIsDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!name || !date || selectedDishes.length === 0) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    setIsCreating(true);

    try {
      const url = editingMenu ? `/api/menus/${editingMenu.id}` : "/api/menus";
      const method = editingMenu ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          date,
          dishIds: selectedDishes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar menú");
      }

      toast.success(editingMenu ? "Menú actualizado" : "Menú creado correctamente");
      setIsDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar menú");
    } finally {
      setIsCreating(false);
    }
  };

  const handlePublish = async (menuId: string) => {
    try {
      const response = await fetch(`/api/menus/${menuId}/publish`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al publicar menú");
      }

      toast.success("Menú publicado y notificaciones enviadas");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al publicar");
    }
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm("¿Estás seguro de eliminar este menú?")) return;

    try {
      const response = await fetch(`/api/menus/${menuId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar menú");
      }

      toast.success("Menú eliminado");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const groupedDishes = availableDishes.reduce(
    (acc, dish) => {
      if (!acc[dish.category]) {
        acc[dish.category] = [];
      }
      acc[dish.category].push(dish);
      return acc;
    },
    {} as Record<string, Dish[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Crea y gestiona los menús diarios para los empleados
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo menú
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingMenu ? "Editar menú" : "Crear nuevo menú"}
              </DialogTitle>
              <DialogDescription>
                Configura el menú y selecciona los platos disponibles
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del menú *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Menú del día"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción opcional del menú"
                  rows={2}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Seleccionar platos *</Label>
                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  {Object.entries(groupedDishes).map(([category, dishes]) => (
                    <div key={category} className="mb-6">
                      <h4 className="font-semibold mb-3">
                        {DishCategoryLabels[category] || category}
                      </h4>
                      <div className="space-y-2">
                        {dishes.map((dish) => (
                          <div
                            key={dish.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                          >
                            <Checkbox
                              checked={selectedDishes.includes(dish.id)}
                              onCheckedChange={(checked) => {
                                setSelectedDishes((prev) =>
                                  checked
                                    ? [...prev, dish.id]
                                    : prev.filter((id) => id !== dish.id)
                                );
                              }}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{dish.name}</p>
                              {dish.description && (
                                <p className="text-sm text-muted-foreground">
                                  {dish.description}
                                </p>
                              )}
                            </div>
                            <span className="text-sm font-medium">
                              {dish.price.toFixed(2)}€
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {availableDishes.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay platos disponibles. Crea algunos platos primero.
                    </p>
                  )}
                </ScrollArea>
                <p className="text-sm text-muted-foreground">
                  {selectedDishes.length} platos seleccionados
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingMenu ? (
                  "Guardar cambios"
                ) : (
                  "Crear menú"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Menus table */}
      <Card>
        <CardHeader>
          <CardTitle>Menús</CardTitle>
          <CardDescription>
            Lista de todos los menús creados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {menus.length === 0 ? (
            <div className="text-center py-12">
              <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay menús creados</p>
              <p className="text-muted-foreground mb-4">
                Crea tu primer menú para que los empleados puedan hacer pedidos
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primer menú
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Platos</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.map((menu) => (
                  <TableRow key={menu.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(menu.date), "dd/MM/yyyy", { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{menu.name}</TableCell>
                    <TableCell>{menu.dishes.length} platos</TableCell>
                    <TableCell>{menu._count.orders} pedidos</TableCell>
                    <TableCell>
                      <Badge
                        variant={menu.isPublished ? "default" : "secondary"}
                      >
                        {menu.isPublished ? "Publicado" : "Borrador"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!menu.isPublished && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublish(menu.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(menu)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => handleDelete(menu.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
