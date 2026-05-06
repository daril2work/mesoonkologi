import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import type { EducationMaterial } from '../types'

import { mapEducationRow } from '../utils/reportMapper'

export function useEducationMaterials(category?: string) {
  return useQuery({
    queryKey: ['educationMaterials', category],
    queryFn: async () => {
      let query = supabase
        .from('education_materials')
        .select('*')
        .order('created_at', { ascending: false })

      if (category && category !== 'Semua') {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map(row => mapEducationRow(row)) as EducationMaterial[]
    }
  })
}

export function useCreateEducation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (material: Omit<EducationMaterial, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('education_materials')
        .insert([{
          title: material.title,
          description: material.description,
          content: material.content,
          category: material.category,
          image_url: material.imageUrl,
          video_url: material.videoUrl,
          is_featured: material.isFeatured
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educationMaterials'] })
    }
  })
}

export function useDeleteEducation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('education_materials')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educationMaterials'] })
    }
  })
}
export function useUpdateEducation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<EducationMaterial> }) => {
      const { data, error } = await supabase
        .from('education_materials')
        .update({
          title: updates.title,
          description: updates.description,
          category: updates.category,
          image_url: updates.imageUrl,
          video_url: updates.videoUrl,
          is_featured: updates.isFeatured
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educationMaterials'] })
      queryClient.invalidateQueries({ queryKey: ['featuredEducation'] })
    }
  })
}

export function useFeaturedMaterial() {
  return useQuery({
    queryKey: ['featuredEducation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_materials')
        .select('*')
        .eq('is_featured', true)
        .limit(1)
        .maybeSingle()

      if (error || !data) return null

      return mapEducationRow(data) as EducationMaterial
    }
  })
}
