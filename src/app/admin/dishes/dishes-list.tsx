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
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { DishCategory, DishCategoryLabels, DishTag, DishTagLabels } from "@/types";

interface Allergy {
  id: string;
  name: string;
}

interface Dish {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  calories: number | null;
  isAvailable: boolean;
  tags: { id: string; tag: string }[];
  allergies: { allergy: Allergy }[];
  _count: { orderItems: number };
}

interface DishesListProps {
  dishes: Dish[];
  allergies: Allergy[];
}

export function DishesList({ dishes, allergies }: DishesListProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("MAIN");
  const [price, setPrice] = useState("");
  const [calories, setCalories] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("MAIN");
    setPrice("");
    setCalories("");
    setSelectedTags([]);
    setSelectedAllergies([]);
    setIsAvailable(true);
    setEditingDish(null);
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setName(dish.name);
    setDescription(dish.description || "");
    setCategory(dish.category);
    setPrice(dish.price.toString());
    setCalories(dish.calories?.toString() || "");
    setSelectedTags(dish.tags.map((t) => t.tag));
    setSelectedAllergies(dish.allergies.map((a) => a.allergy.id));
    setIsAvailable(dish.isAvailable);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !category) {
      toast.error("Nombre y categoría son requeridos");
      return;
    }

    setIsLoading(true);

    try {
      const url = editingDish ? `/api/dishes/${editingDish.id}` : "/api/dishes";
      const method = editingDish ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          category,
          price: parseFloat(price) || 0,
          calories: calories ? parseInt(calories) : null,
          tags: selectedTags,
          allergyIds: selectedAllergies,
          isAvailable,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar plato");
      }

      toast.success(editingDish ? "Plato actualizado" : "Plato creado correctamente");
      setIsDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar plato");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (dishId: string) => {
    if (!confirm("¿Estás seguro de eliminar este plato?")) return;

    try {
      const response = await fetch(`/api/dishes/${dishId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar plato");
      }

      toast.success("Plato eliminado");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleToggleAvailability = async (dish: Dish) => {
    try {
      const response = await fetch(`/api/dishes/${dish.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAvailable: !dish.isAvailable,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al cambiar disponibilidad");
      }

      toast.success(
        dish.isAvailable ? "Plato desactivado" : "Plato activado"
      );
      router.refresh();
    } catch (error) {
      toast.error("Error al cambiar disponibilidad");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Gestiona los platos disponibles para los menús
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo plato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDish ? "Editar plato" : "Crear nuevo plato"}
              </DialogTitle>
              <DialogDescription>
                Configura los detalles del plato
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre del plato"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DishCategory).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {DishCategoryLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del plato"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calories">Calorías</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="Calorías por ración"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Etiquetas</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(DishTag).map(([key, value]) => (
                    <Badge
                      key={key}
                      variant={selectedTags.includes(value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.includes(value)
                            ? prev.filter((t) => t !== value)
                            : [...prev, value]
                        )
                      }
                    >
                      {DishTagLabels[value]}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alérgenos</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {allergies.map((allergy) => (
                    <div key={allergy.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedAllergies.includes(allergy.id)}
                        onCheckedChange={(checked) =>
                          setSelectedAllergies((prev) =>
                            checked
                              ? [...prev, allergy.id]
                              : prev.filter((id) => id !== allergy.id)
                          )
                        }
                      />
                      <span className="text-sm">{allergy.name}</span>
                    </div>
                  ))}
                </div>
                {allergies.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay alérgenos configurados
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                />
                <Label>Disponible para menús</Label>
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
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingDish ? (
                  "Guardar cambios"
                ) : (
                  "Crear plato"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dishes table */}
      <Card>
        <CardHeader>
          <CardTitle>Platos</CardTitle>
          <CardDescription>
            Lista de todos los platos disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dishes.length === 0 ? (
            <div className="text-center py-12">
              <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay platos creados</p>
              <p className="text-muted-foreground mb-4">
                Crea platos para poder añadirlos a los menús
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primer plato
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Etiquetas</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dishes.map((dish) => (
                  <TableRow key={dish.id}>
                    <TableCell className="font-medium">
                      <div>
                        {dish.name}
                        {dish.allergies.length > 0 && (
                          <p className="text-xs text-orange-600">
                            Alérgenos: {dish.allergies.map((a) => a.allergy.name).join(", ")}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{DishCategoryLabels[dish.category]}</TableCell>
                    <TableCell>{dish.price.toFixed(2)}€</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {dish.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {DishTagLabels[tag.tag] || tag.tag}
                          </Badge>
                        ))}
                        {dish.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{dish.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{dish._count.orderItems}</TableCell>
                    <TableCell>
                      <Switch
                        checked={dish.isAvailable}
                        onCheckedChange={() => handleToggleAvailability(dish)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(dish)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => handleDelete(dish.id)}
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
