import { useState, useCallback, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'

interface Props {
  visible: boolean
  imageUri: string | null
  onConfirm: (uri: string, base64: string) => void
  onCancel: () => void
}

const CROP_CSS = `
.reactEasyCrop_Container{position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;user-select:none;touch-action:none;cursor:move;display:flex;justify-content:center;align-items:center;}
.reactEasyCrop_Image,.reactEasyCrop_Video{will-change:transform;max-width:unset;}
.reactEasyCrop_Contain{max-width:100%;max-height:100%;margin:auto;position:absolute;top:0;bottom:0;left:0;right:0;}
.reactEasyCrop_Cover_Horizontal{width:100%;height:auto;}
.reactEasyCrop_Cover_Vertical{width:auto;height:100%;}
.reactEasyCrop_CropArea{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:2px solid rgba(255,255,255,0.7);box-sizing:border-box;box-shadow:0 0 0 9999em rgba(0,0,0,0.6);overflow:hidden;}
.reactEasyCrop_CropAreaGrid::before{content:' ';box-sizing:border-box;position:absolute;border:1px solid rgba(255,255,255,0.35);top:0;bottom:0;left:33.33%;right:33.33%;border-top:0;border-bottom:0;}
.reactEasyCrop_CropAreaGrid::after{content:' ';box-sizing:border-box;position:absolute;border:1px solid rgba(255,255,255,0.35);top:33.33%;bottom:33.33%;left:0;right:0;border-left:0;border-right:0;}
`

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<{ uri: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas context unavailable')); return }
      ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      const base64 = dataUrl.split(',')[1] ?? ''
      resolve({ uri: dataUrl, base64 })
    }
    img.onerror = () => reject(new Error('image load failed'))
    img.src = imageSrc
  })
}

const ASPECT_OPTIONS = [
  { label: '1:1',  value: 1 },
  { label: '4:3',  value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:4',  value: 3 / 4 },
  { label: '9:16', value: 9 / 16 },
] as const

export default function ImageCropModal({ visible, imageUri, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Inject Cropper CSS once into document head
  useEffect(() => {
    const existing = document.getElementById('react-easy-crop-style')
    if (existing) return
    const tag = document.createElement('style')
    tag.id = 'react-easy-crop-style'
    tag.textContent = CROP_CSS
    document.head.appendChild(tag)
  }, [])

  // Reset crop state when a new image is shown
  useEffect(() => {
    if (visible) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setAspect(1)
      setCroppedAreaPixels(null)
    }
  }, [visible, imageUri])

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!imageUri || !croppedAreaPixels || confirming) return
    setConfirming(true)
    try {
      const result = await getCroppedImg(imageUri, croppedAreaPixels)
      onConfirm(result.uri, result.base64)
    } catch (e) {
      console.error('[ImageCropModal] crop error:', e)
    } finally {
      setConfirming(false)
    }
  }

  if (!visible || !imageUri) return null

  const winHeight = Dimensions.get('window').height

  return (
    <View style={styles.overlay}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.headerBtn} activeOpacity={0.7}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.title}>사진 자르기</Text>
        <TouchableOpacity
          onPress={handleConfirm}
          style={styles.headerBtn}
          activeOpacity={0.7}
          disabled={confirming}
        >
          <Text style={[styles.confirmText, confirming && styles.confirmTextDisabled]}>
            완료
          </Text>
        </TouchableOpacity>
      </View>

      {/* Crop area */}
      <View style={[styles.cropContainer, { height: winHeight * 0.65 }]}>
        <Cropper
          image={imageUri}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid
          style={{
            containerStyle: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
          }}
        />
      </View>

      {/* Aspect ratio selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.aspectRow}
        style={styles.aspectScroll}
      >
        {ASPECT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.aspectBtn, aspect === opt.value && styles.aspectBtnActive]}
            onPress={() => setAspect(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.aspectText, aspect === opt.value && styles.aspectTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.hint}>드래그하여 이동 · 스크롤/핀치로 확대</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 9999,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#fbfcfe',
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },
  headerBtn: { minWidth: 52, alignItems: 'center', padding: 4 },
  cancelText: { color: '#9A9FB3', fontSize: 15, fontFamily: 'Pretendard-Regular' },
  confirmText: { color: '#534dfc', fontSize: 15, fontFamily: 'Pretendard-SemiBold' },
  confirmTextDisabled: { opacity: 0.5 },

  cropContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#111',
    overflow: 'hidden',
  },

  aspectScroll: { flexShrink: 0, flexGrow: 0 },
  aspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  aspectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  aspectBtnActive: {
    borderColor: '#534dfc',
    backgroundColor: 'rgba(83,77,252,0.2)',
  },
  aspectText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
  },
  aspectTextActive: { color: '#fbfcfe' },

  hint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    paddingBottom: 20,
  },
})
