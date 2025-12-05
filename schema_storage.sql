-- Fix RLS policies for artist-photos and artist-waivers storage buckets
-- This migration makes the storage buckets completely public for everyone

-- First, drop existing policies to avoid conflicts
-- Artist photos policies
DROP POLICY IF EXISTS "Authenticated users can upload artist photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view artist photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own artist photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own artist photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to artist-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access to artist-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to artist-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from artist-photos" ON storage.objects;

-- Artist waivers policies
DROP POLICY IF EXISTS "Authenticated users can upload artist waivers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view artist waivers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own artist waivers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own artist waivers" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to artist-waivers" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access to artist-waivers" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to artist-waivers" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from artist-waivers" ON storage.objects;

-- Artist policies policies
DROP POLICY IF EXISTS "Authenticated users can upload artist policies" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view artist policies" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own artist policies" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own artist policies" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to artist-policies" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access to artist-policies" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to artist-policies" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from artist-policies" ON storage.objects;

-- Artist terms policies
DROP POLICY IF EXISTS "Authenticated users can upload artist terms" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view artist terms" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own artist terms" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own artist terms" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to artist-terms" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access to artist-terms" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to artist-terms" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from artist-terms" ON storage.objects;

-- Create completely open policies for artist photos
-- These policies allow ANYONE (authenticated or not) to upload, view, update, and delete photos
-- in the artist-photos bucket

-- Allow anyone to upload photos to artist-photos bucket
CREATE POLICY "Allow public uploads to artist-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artist-photos');

-- Allow anyone to view photos in artist-photos bucket
CREATE POLICY "Allow public access to artist-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'artist-photos');

-- Allow anyone to update photos in artist-photos bucket
CREATE POLICY "Allow public updates to artist-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'artist-photos');

-- Allow anyone to delete photos in artist-photos bucket
CREATE POLICY "Allow public deletes from artist-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'artist-photos');

-- Create completely open policies for artist waivers
-- These policies allow ANYONE (authenticated or not) to upload, view, update, and delete waivers
-- in the artist-waivers bucket

-- Allow anyone to upload waivers to artist-waivers bucket
CREATE POLICY "Allow public uploads to artist-waivers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artist-waivers');

-- Allow anyone to view waivers in artist-waivers bucket
CREATE POLICY "Allow public access to artist-waivers" ON storage.objects
  FOR SELECT USING (bucket_id = 'artist-waivers');

-- Allow anyone to update waivers in artist-waivers bucket
CREATE POLICY "Allow public updates to artist-waivers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'artist-waivers');

-- Allow anyone to delete waivers in artist-waivers bucket
CREATE POLICY "Allow public deletes from artist-waivers" ON storage.objects
  FOR DELETE USING (bucket_id = 'artist-waivers');

-- Create completely open policies for artist policies
-- These policies allow ANYONE (authenticated or not) to upload, view, update, and delete policies
-- in the artist-policies bucket

-- Allow anyone to upload policies to artist-policies bucket
CREATE POLICY "Allow public uploads to artist-policies" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artist-policies');

-- Allow anyone to view policies in artist-policies bucket
CREATE POLICY "Allow public access to artist-policies" ON storage.objects
  FOR SELECT USING (bucket_id = 'artist-policies');

-- Allow anyone to update policies in artist-policies bucket
CREATE POLICY "Allow public updates to artist-policies" ON storage.objects
  FOR UPDATE USING (bucket_id = 'artist-policies');

-- Allow anyone to delete policies in artist-policies bucket
CREATE POLICY "Allow public deletes from artist-policies" ON storage.objects
  FOR DELETE USING (bucket_id = 'artist-policies');

-- Create completely open policies for artist terms
-- These policies allow ANYONE (authenticated or not) to upload, view, update, and delete terms
-- in the artist-terms bucket

-- Allow anyone to upload terms to artist-terms bucket
CREATE POLICY "Allow public uploads to artist-terms" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artist-terms');

-- Allow anyone to view terms in artist-terms bucket
CREATE POLICY "Allow public access to artist-terms" ON storage.objects
  FOR SELECT USING (bucket_id = 'artist-terms');

-- Allow anyone to update terms in artist-terms bucket
CREATE POLICY "Allow public updates to artist-terms" ON storage.objects
  FOR UPDATE USING (bucket_id = 'artist-terms');

-- Allow anyone to delete terms in artist-terms bucket
CREATE POLICY "Allow public deletes from artist-terms" ON storage.objects
  FOR DELETE USING (bucket_id = 'artist-terms'); 


-- Allow anyone to upload flashs to artist-flashs bucket
CREATE POLICY "Allow public uploads to artist-flashs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artist-flashs');

-- Allow anyone to view terms in artist-flashs bucket
CREATE POLICY "Allow public access to artist-flashs" ON storage.objects
  FOR SELECT USING (bucket_id = 'artist-flashs');

-- Allow anyone to update flashs in artist-flashs bucket
CREATE POLICY "Allow public updates to artist-flashs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'artist-flashs');

-- Allow anyone to delete flashs in artist-flashs bucket
CREATE POLICY "Allow public deletes from artist-flashs" ON storage.objects
  FOR DELETE USING (bucket_id = 'artist-flashs'); 


-- Allow anyone to upload portfolios to artist-portfolios bucket
CREATE POLICY "Allow public uploads to artist-portfolios" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artist-portfolios');

-- Allow anyone to view portfolios in artist-portfolios bucket
CREATE POLICY "Allow public access to artist-portfolios" ON storage.objects
  FOR SELECT USING (bucket_id = 'artist-portfolios');

-- Allow anyone to update portfolios in artist-portfolios bucket
CREATE POLICY "Allow public updates to artist-portfolios" ON storage.objects
  FOR UPDATE USING (bucket_id = 'artist-portfolios');

-- Allow anyone to delete portfolios in artist-portfolios bucket
CREATE POLICY "Allow public deletes from artist-portfolios" ON storage.objects
  FOR DELETE USING (bucket_id = 'artist-portfolios'); 
  

-- Allow anyone to upload drawings to artist-drawings bucket
CREATE POLICY "Allow public uploads to artist-drawings" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artist-drawings');

-- Allow anyone to view drawings in artist-drawings bucket
CREATE POLICY "Allow public access to artist-drawings" ON storage.objects
  FOR SELECT USING (bucket_id = 'artist-drawings');

-- Allow anyone to update drawings in artist-drawings bucket
CREATE POLICY "Allow public updates to artist-drawings" ON storage.objects
  FOR UPDATE USING (bucket_id = 'artist-drawings');

-- Allow anyone to delete drawings in artist-drawings bucket
CREATE POLICY "Allow public deletes from artist-drawings" ON storage.objects
  FOR DELETE USING (bucket_id = 'artist-drawings');


-- Allow anyone to upload request-photos to request-photos bucket
CREATE POLICY "Allow public uploads to request-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'request-photos');

-- Allow anyone to view request-photos in request-photos bucket
CREATE POLICY "Allow public access to request-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'request-photos');

-- Allow anyone to update request-photos in request-photos bucket
CREATE POLICY "Allow public updates to request-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'request-photos');

-- Allow anyone to delete request-photos in request-photos bucket
CREATE POLICY "Allow public deletes from request-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'request-photos'); 


-- Allow anyone to upload client-photos to client-photos bucket
CREATE POLICY "Allow public uploads to client-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client-photos');

-- Allow anyone to view client-photos in client-photos bucket
CREATE POLICY "Allow public access to client-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-photos');

-- Allow anyone to update client-photos in client-photos bucket
CREATE POLICY "Allow public updates to client-photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'client-photos');

-- Allow anyone to delete client-photos in client-photos bucket
CREATE POLICY "Allow public deletes from client-photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'client-photos'); 

-- Ensure the buckets exist and are public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artist-photos', 'artist-photos', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('artist-waivers', 'artist-waivers', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('artist-policies', 'artist-policies', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('artist-terms', 'artist-terms', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('artist-flashs', 'artist-flashs', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('artist-portfolios', 'artist-portfolios', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('artist-drawings', 'artist-drawings', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('request-photos', 'request-photos', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public;