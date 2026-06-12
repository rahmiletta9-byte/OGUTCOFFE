import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { uploadMenuImage } from '../services/storageService';
import { logActivity } from '@/lib/logger';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PlusCircle, Image as ImageIcon, Tag, Banknote, ArrowRight, ArrowLeft, Check, Package, Trash2, Plus, Edit } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MenuForm({ initialData, onSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data Master
  const [availableMaterials, setAvailableMaterials] = useState([]);
  
  // Step 1 State: Info Dasar
  const [productData, setProductData] = useState({ name: '', price: '', cost_price: '', category: 'Kopi' });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Step 2 State: Recipe / Materials
  const [recipeItems, setRecipeItems] = useState([]); 
  // { material_id: '...', name: '...', quantity: 1, isNew: false, unit: 'kg' }

  // Step 2 Search & Autocomplete State
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchMaterials();
    
    if (initialData) {
      setProductData({
        name: initialData.name,
        price: initialData.price,
        cost_price: initialData.cost_price,
        category: initialData.category || 'Kopi'
      });
      setPreviewUrl(initialData.image_url);
      fetchExistingRecipe(initialData.id);
    }
  }, [initialData]);

  const fetchMaterials = async () => {
    const { data } = await supabase.from('materials').select('*').order('name');
    if (data) setAvailableMaterials(data);
  };

  const fetchExistingRecipe = async (productId) => {
    const { data } = await supabase
      .from('product_materials')
      .select(`
        quantity_used,
        materials ( id, name, unit )
      `)
      .eq('product_id', productId);
    
    if (data) {
      const formatted = data.map(item => ({
        material_id: item.materials.id,
        name: item.materials.name,
        quantity: item.quantity_used,
        isNew: false,
        unit: item.materials.unit
      }));
      setRecipeItems(formatted);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const addExistingMaterial = (materialId) => {
    const mat = availableMaterials.find(m => m.id === materialId);
    if (!mat) return;
    if (recipeItems.some(item => item.material_id === materialId)) return; // prevent duplicate
    
    setRecipeItems([...recipeItems, { material_id: mat.id, name: mat.name, quantity: 1, isNew: false, unit: mat.unit }]);
  };

  const handleCreateNewMaterialFromSearch = (nameToCreate) => {
    if (!nameToCreate.trim()) return;
    // Cek jika nama sudah ada di resep untuk menghindari duplikat
    if (recipeItems.some(item => item.name.toLowerCase() === nameToCreate.trim().toLowerCase())) return;
    
    setRecipeItems([...recipeItems, { 
      material_id: `new-${Date.now()}`, 
      name: nameToCreate.trim(), 
      quantity: 1, 
      isNew: true, 
      unit: 'gr' 
    }]);
    
    setMaterialSearchQuery('');
    setIsDropdownOpen(false);
  };

  const updateRecipeItem = (index, field, value) => {
    const updated = [...recipeItems];
    updated[index][field] = value;
    setRecipeItems(updated);
  };

  const removeRecipeItem = (index) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Upload Image
      let imageUrl = initialData ? initialData.image_url : null;
      if (imageFile) imageUrl = await uploadMenuImage(imageFile);

      // 2. Insert or Update Product
      let productId;
      
      if (initialData) {
        const { error: prodError } = await supabase.from('products').update({
          name: productData.name,
          price: parseFloat(productData.price),
          cost_price: parseFloat(productData.cost_price),
          category: productData.category,
          image_url: imageUrl
        }).eq('id', initialData.id);
        
        if (prodError) throw prodError;
        productId = initialData.id;

        // Hapus resep lama sebelum insert yang baru
        await supabase.from('product_materials').delete().eq('product_id', productId);
      } else {
        const { data: newProduct, error: prodError } = await supabase.from('products').insert([{
          name: productData.name,
          price: parseFloat(productData.price),
          cost_price: parseFloat(productData.cost_price),
          category: productData.category,
          image_url: imageUrl
        }]).select().single();
        
        if (prodError) throw prodError;
        productId = newProduct.id;
      }

      // 3. Process Materials
      for (const item of recipeItems) {
        let finalMaterialId = item.material_id;

        // If it's a new material, insert it first
        if (item.isNew) {
          const { data: newMat, error: matError } = await supabase.from('materials').insert([{
            name: item.name,
            unit: item.unit,
            current_stock: 0
          }]).select().single();
          if (matError) throw matError;
          finalMaterialId = newMat.id;
        }

        // 4. Link Product to Material
        const { error: pmError } = await supabase.from('product_materials').insert([{
          product_id: productId,
          material_id: finalMaterialId,
          quantity_used: parseFloat(item.quantity)
        }]);

        if (pmError) throw pmError;
      }

      await logActivity(
        user?.id, 
        initialData ? 'UPDATE_MENU' : 'CREATE_MENU', 
        `${initialData ? 'Mengubah' : 'Menambahkan'} menu: ${productData.name}`
      );
      
      alert(`Menu & Resep berhasil ${initialData ? 'diperbarui' : 'ditambahkan'}!`);
      if (onSuccess) onSuccess(); 

    } catch (error) {
      alert('Gagal: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isEditMode = !!initialData;

  const filteredMaterials = availableMaterials.filter(mat => 
    mat.name.toLowerCase().includes(materialSearchQuery.toLowerCase())
  );

  return (
    <Card className="rounded-[3rem] border-none shadow-xl shadow-stone-200/50 bg-white overflow-hidden max-h-[90vh] flex flex-col">
      <CardHeader className="p-10 pb-4 shrink-0 border-b border-muted/30">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
                <div className={`${isEditMode ? 'bg-amber-500 shadow-amber-500/20' : 'bg-primary shadow-primary/20'} p-3 rounded-2xl text-primary-foreground shadow-lg`}>
                    {isEditMode ? <Edit size={24} /> : <PlusCircle size={24} />}
                </div>
                <div>
                    <CardTitle className="text-2xl font-black tracking-tighter uppercase text-foreground">
                        {step === 1 ? 'Langkah 1: Info Dasar' : 'Langkah 2: Resep & Bahan'}
                    </CardTitle>
                    <CardDescription className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] opacity-60">
                        {isEditMode ? 'Edit data menu' : 'Tambah menu baru'}
                    </CardDescription>
                </div>
            </div>
            <div className="flex gap-2">
                <div className={`w-12 h-2 rounded-full ${step >= 1 ? (isEditMode ? 'bg-amber-500' : 'bg-primary') : 'bg-muted'}`}></div>
                <div className={`w-12 h-2 rounded-full ${step >= 2 ? (isEditMode ? 'bg-amber-500' : 'bg-primary') : 'bg-muted'}`}></div>
            </div>
        </div>
      </CardHeader>

      <CardContent className="p-10 pt-6 overflow-y-auto flex-1 scrollbar-hide">
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-left-4 fade-in duration-300">
            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-50">Nama Menu</label>
              <div className="relative">
                <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                <Input 
                  type="text" 
                  placeholder="Contoh: Kopi Susu Aren" 
                  required 
                  className="h-14 pl-14 rounded-[1.25rem] bg-muted/30 border-none focus-visible:ring-primary shadow-inner text-base font-bold"
                  value={productData.name}
                  onChange={(e) => setProductData({...productData, name: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-50">Harga Jual</label>
                <div className="relative">
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={18} />
                  <Input 
                    type="number" 
                    placeholder="25000" 
                    required 
                    className="h-14 pl-12 rounded-[1.25rem] bg-muted/30 border-none focus-visible:ring-primary shadow-inner text-base font-bold"
                    value={productData.price}
                    onChange={(e) => setProductData({...productData, price: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-50">Modal / HPP</label>
                <div className="relative">
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={18} />
                  <Input 
                    type="number" 
                    placeholder="15000" 
                    required 
                    className="h-14 pl-12 rounded-[1.25rem] bg-muted/30 border-none focus-visible:ring-primary shadow-inner text-base font-bold"
                    value={productData.cost_price}
                    onChange={(e) => setProductData({...productData, cost_price: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-50">Kategori</label>
              <select 
                className="w-full h-14 px-6 bg-muted/30 border-none rounded-[1.25rem] focus:ring-2 focus:ring-primary outline-none transition-all text-base font-bold appearance-none cursor-pointer shadow-inner" 
                value={productData.category}
                onChange={(e) => setProductData({...productData, category: e.target.value})}
              >
                <option value="Kopi">Kopi</option>
                <option value="Non-Kopi">Non-Kopi</option>
                <option value="Makanan">Makanan</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-50">Foto Produk</label>
              <div className="flex items-center gap-6">
                <Card className="h-32 w-32 rounded-[2rem] bg-muted/30 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="text-muted-foreground opacity-20" size={40} />
                  )}
                </Card>
                <div className="flex flex-col gap-2">
                    <label className={`${isEditMode ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' : 'bg-primary hover:bg-primary/90 shadow-primary/10'} text-primary-foreground px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all shadow-lg w-fit`}>
                      {isEditMode && previewUrl ? 'Ganti Foto' : 'Upload Foto'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                    <p className="text-[10px] text-muted-foreground font-bold italic">Max: 2MB (.jpg, .png)</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                if(!productData.name || !productData.price || !productData.cost_price) {
                  alert("Lengkapi data yang diwajibkan."); return;
                }
                setStep(2);
              }}
              className={`w-full h-16 rounded-[1.5rem] font-black text-lg shadow-xl uppercase tracking-widest mt-4 group ${isEditMode ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white' : 'shadow-primary/20'}`}
            >
              Lanjut ke Resep
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            
            <div className="bg-muted/10 p-6 rounded-[2rem] border border-muted/20">
              <h4 className="font-black uppercase tracking-tight mb-4 flex items-center gap-2 text-foreground">
                <Package className={`${isEditMode ? 'text-amber-500' : 'text-primary'}`} size={20} />
                Komposisi Bahan
              </h4>

              {recipeItems.map((item, index) => (
                <div key={index} className="flex gap-3 mb-3 items-start animate-in fade-in zoom-in duration-200">
                  <div className="flex-1 space-y-2">
                    {item.isNew ? (
                       <Input 
                        placeholder="Nama Bahan Baru" 
                        value={item.name} 
                        onChange={(e) => updateRecipeItem(index, 'name', e.target.value)}
                        className="bg-white border-muted h-12 font-bold shadow-sm"
                      />
                    ) : (
                      <div className="h-12 flex items-center px-4 bg-white border border-muted rounded-md font-bold text-sm shadow-sm truncate">
                        {item.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-24 shrink-0">
                    <Input 
                      type="number" 
                      placeholder="Qty" 
                      value={item.quantity} 
                      onChange={(e) => updateRecipeItem(index, 'quantity', e.target.value)}
                      className="bg-white border-muted h-12 font-bold shadow-sm text-center"
                    />
                  </div>

                  {item.isNew ? (
                     <div className="w-24 shrink-0">
                        <select 
                          className="w-full h-12 px-3 bg-white border border-muted rounded-md font-bold text-sm outline-none shadow-sm"
                          value={item.unit}
                          onChange={(e) => updateRecipeItem(index, 'unit', e.target.value)}
                        >
                          <option value="gr">Gram</option>
                          <option value="ml">Mililiter</option>
                          <option value="pcs">Pcs</option>
                          <option value="kg">Kg</option>
                        </select>
                     </div>
                  ) : (
                    <div className="w-20 shrink-0 h-12 flex items-center justify-center bg-muted/20 rounded-md font-bold text-xs uppercase text-muted-foreground">
                      {item.unit}
                    </div>
                  )}

                  <Button 
                    variant="ghost" 
                    className="w-12 h-12 shrink-0 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeRecipeItem(index)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}

              <div className="relative mt-6 pt-4 border-t border-muted/20">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-50 block mb-2">Cari & Tambah Bahan Baku</label>
                <div className="relative">
                  <Input 
                    type="text" 
                    placeholder="Ketik nama bahan (contoh: Espresso, Susu, Gula...)" 
                    className="h-12 pl-4 pr-10 rounded-[1rem] bg-white border border-muted focus-visible:ring-primary shadow-sm text-sm font-bold w-full"
                    value={materialSearchQuery}
                    onChange={(e) => {
                      setMaterialSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                  />
                  {materialSearchQuery && (
                    <button 
                      onClick={() => setMaterialSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-muted/30 max-h-60 overflow-y-auto z-20 scrollbar-hide py-2 animate-in slide-in-from-top-2 duration-200">
                      {filteredMaterials.length > 0 ? (
                        filteredMaterials.map(mat => {
                          const isAlreadyAdded = recipeItems.some(item => item.material_id === mat.id);
                          return (
                            <button
                              key={mat.id}
                              type="button"
                              disabled={isAlreadyAdded}
                              onClick={() => {
                                addExistingMaterial(mat.id);
                                setMaterialSearchQuery('');
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-5 py-3 text-sm font-bold flex items-center justify-between transition-colors ${
                                isAlreadyAdded 
                                  ? 'text-muted-foreground/40 bg-muted/5 cursor-not-allowed' 
                                  : 'text-foreground hover:bg-muted/30'
                              }`}
                            >
                              <span>{mat.name} ({mat.unit})</span>
                              {isAlreadyAdded ? (
                                <span className="text-[10px] uppercase tracking-wider font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">Sudah Ada</span>
                              ) : (
                                <span className="text-[10px] uppercase tracking-wider font-black text-muted-foreground/50">Gudang</span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-5 py-3 text-xs font-bold text-muted-foreground italic">
                          Tidak ada bahan gudang yang cocok
                        </div>
                      )}

                      {materialSearchQuery.trim() && (
                        <div className="border-t border-muted/20 my-1 pt-1">
                          <button
                            type="button"
                            onClick={() => handleCreateNewMaterialFromSearch(materialSearchQuery)}
                            className="w-full text-left px-5 py-3 text-sm font-black text-primary hover:bg-primary/5 flex items-center gap-2 transition-colors uppercase tracking-wider text-xs"
                          >
                            <Plus size={14} />
                            Buat bahan baru: "{materialSearchQuery.trim()}"
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                variant="ghost"
                onClick={() => setStep(1)}
                className="h-16 px-6 rounded-[1.5rem] font-black text-sm uppercase tracking-widest bg-muted/20 hover:bg-muted/30"
              >
                <ArrowLeft className="mr-2" />
                Kembali
              </Button>

              <Button 
                onClick={handleSubmit}
                disabled={isLoading}
                className={`flex-1 h-16 rounded-[1.5rem] font-black text-lg shadow-xl uppercase tracking-widest group ${isEditMode ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white' : 'shadow-primary/20'}`}
              >
                {isLoading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan Menu')}
                {!isLoading && <Check className="ml-2 group-hover:scale-125 transition-transform" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
